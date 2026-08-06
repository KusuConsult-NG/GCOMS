/**
 * Encrypted-at-rest storage for the little that has to survive a reload.
 *
 * The offline registration queue holds patient data — names, dates of birth,
 * phone numbers, addresses, GPS — on a field device until it syncs. Plain
 * localStorage puts that in reach of anything that can read the origin's
 * storage: another script, a browser extension with storage access, a profile
 * copied off an unlocked phone, a device backup.
 *
 * So the value is AES-GCM encrypted under a key that is generated on the
 * device, marked non-extractable, and kept in IndexedDB. Non-extractable means
 * the key material cannot be read out and carried away even by code running in
 * this origin — a copy of localStorage is no longer enough, the attacker needs
 * live script execution on that device.
 *
 * What this is not: protection against script injection in the page, which can
 * ask this module to decrypt just as the app does. The CSP nonce in proxy.ts is
 * what addresses that. Nor is it a substitute for device-level controls —
 * screen lock, remote wipe, full-disk encryption. It removes plaintext PHI at
 * rest, which is the part the app can do something about.
 *
 * If the platform offers neither WebCrypto nor IndexedDB, nothing is written.
 * Refusing to persist is the right failure: the alternative is writing the
 * plaintext this module exists to avoid.
 */

const DB_NAME = 'gcoms-secure';
const STORE = 'keys';
const KEY_ID = 'offline-queue';
const IV_BYTES = 12;

export class SecureStoreUnavailable extends Error {
  constructor() {
    super('This browser cannot store patient data safely on the device.');
    this.name = 'SecureStoreUnavailable';
  }
}

function available(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof indexedDB !== 'undefined' &&
    typeof crypto !== 'undefined' &&
    !!crypto.subtle
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexedDB open failed'));
  });
}

function tx<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexedDB request failed'));
  });
}

let keyPromise: Promise<CryptoKey> | null = null;

/**
 * The device key, generated once and reused. A CryptoKey survives the
 * structured clone IndexedDB uses, so the non-extractable handle can be stored
 * directly — at no point does the raw key exist anywhere readable.
 */
function deviceKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const db = await openDb();
      const existing = await tx<CryptoKey | undefined>(db, 'readonly', (s) => s.get(KEY_ID));
      if (existing) return existing;

      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
        'encrypt',
        'decrypt',
      ]);
      await tx(db, 'readwrite', (s) => s.put(key, KEY_ID));
      return key;
    })().catch((err) => {
      // Don't cache a failure: a later attempt may succeed once storage is
      // available again.
      keyPromise = null;
      throw err;
    });
  }
  return keyPromise;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** A fresh IV per write, prefixed to the ciphertext. Reusing one under the same key would leak. */
export async function encryptJson(value: unknown): Promise<string> {
  if (!available()) throw new SecureStoreUnavailable();
  const key = await deviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded),
  );
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv);
  packed.set(cipher, iv.length);
  return toBase64(packed);
}

export async function decryptJson(value: string): Promise<unknown> {
  if (!available()) throw new SecureStoreUnavailable();
  const key = await deviceKey();
  const packed = fromBase64(value);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: packed.slice(0, IV_BYTES) },
    key,
    packed.slice(IV_BYTES),
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

export function secureStoreAvailable(): boolean {
  return available();
}
