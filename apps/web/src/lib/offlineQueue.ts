import {
  decryptJson,
  encryptJson,
  secureStoreAvailable,
} from '@/lib/secureStore';

/**
 * Field registrations captured while the API was unreachable.
 *
 * The volunteer workspace is used on phones in LGAs where a connection is not a
 * given. Before this, a registration that failed to send was simply refused:
 * the form kept what had been typed and the volunteer had to stand still and
 * retry, or lose it. This holds the record instead and replays it when the
 * connection returns.
 *
 * The queue holds patient data, so it is encrypted at rest — see secureStore.ts
 * for what that does and does not protect against. If the device cannot encrypt
 * it, nothing is written to disk: the queue still works for the session but
 * will not survive a reload, and `persistent` says so, so the workspace can
 * tell the volunteer rather than quietly losing records at the next reload.
 *
 * Replaying is safe to repeat. Each capture carries an idempotency key the API
 * de-duplicates on, so a request the server commits but whose response is lost
 * returns the original record on the retry instead of registering the patient a
 * second time.
 *
 * Each capture also records who took it. Field devices are shared, and the
 * server attributes a registration to whoever is holding the token when it
 * arrives — so without this, records captured by one volunteer and synced after
 * someone else signs in are filed under the wrong name. That is the audit
 * trail, and on a patient record it is not a detail.
 */

const KEY = 'gcoms-offline-registrations';

export type QueuedRegistrationPayload = {
  /** Generated when the registration is captured, not when it is sent, so every
   *  attempt at the same capture carries the same one. */
  idempotencyKey: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
  lga: string;
  ward: string;
  gpsCoordinates: string;
  consentGiven: boolean;
};

export type QueuedRegistration = {
  /** Local only. The registration id is the server's to assign, and it has not
   *  seen this record yet. */
  localId: string;
  capturedAt: string;
  /** The signed-in user who took the registration. Replay is refused under any
   *  other account rather than misattributing it. */
  capturedById: string;
  capturedByName: string;
  payload: QueuedRegistrationPayload;
  /** Set when the server rejected the record outright, so it is not retried in
   *  a loop that cannot succeed. */
  rejectedReason?: string;
};

export type QueueState = {
  items: QueuedRegistration[];
  /** False when the device cannot encrypt, so the queue is memory-only. */
  persistent: boolean;
};

function isQueued(item: unknown): item is QueuedRegistration {
  return (
    !!item &&
    typeof item === 'object' &&
    typeof (item as QueuedRegistration).localId === 'string' &&
    typeof (item as QueuedRegistration).capturedById === 'string' &&
    !!(item as QueuedRegistration).payload
  );
}

/** How long a record may sit unsynced before the workspace says so. Patient data
 *  on a field device is not meant to be storage. */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isStale(item: QueuedRegistration, now: number): boolean {
  return now - new Date(item.capturedAt).getTime() > STALE_AFTER_MS;
}

/**
 * Everything the session has captured, whether or not it could be written down.
 *
 * Held here so a device that cannot encrypt still gets a working queue for as
 * long as the tab lives, instead of silently dropping registrations.
 */
let memoryItems: QueuedRegistration[] = [];

export async function readQueue(): Promise<QueueState> {
  if (typeof window === 'undefined') return { items: [], persistent: true };
  if (!secureStoreAvailable()) {
    return { items: memoryItems, persistent: false };
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return { items: memoryItems, persistent: true };
    }

    // An earlier build wrote this queue as plain JSON. Anything left from it is
    // unencrypted patient data sitting on the device, so it is taken in and
    // rewritten encrypted rather than merely tolerated.
    if (raw.startsWith('[')) {
      const legacy: unknown = JSON.parse(raw);
      const items = Array.isArray(legacy) ? legacy.filter(isQueued) : [];
      memoryItems = items;
      await writeQueue(items);
      return { items, persistent: true };
    }

    const parsed = await decryptJson(raw);
    const items = Array.isArray(parsed) ? parsed.filter(isQueued) : [];
    memoryItems = items;
    return { items, persistent: true };
  } catch {
    // A queue that cannot be decrypted — a rotated key, a truncated write — is
    // unreadable by anything, so keeping it only leaves ciphertext on the disk.
    window.localStorage.removeItem(KEY);
    memoryItems = [];
    return { items: [], persistent: true };
  }
}

async function writeQueue(items: QueuedRegistration[]): Promise<QueueState> {
  memoryItems = items;
  if (typeof window === 'undefined') return { items, persistent: true };
  if (!secureStoreAvailable()) return { items, persistent: false };

  try {
    if (!items.length) {
      // Nothing to hold, so hold nothing: an empty queue leaves no patient data
      // on the device at all.
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, await encryptJson(items));
    }
    return { items, persistent: true };
  } catch {
    // Quota exceeded, storage disabled, or encryption unavailable. The session
    // keeps its queue; it just will not survive a reload.
    return { items, persistent: false };
  }
}

export async function enqueue(
  payload: QueuedRegistrationPayload,
  capturedAt: string,
  capturedBy: { id: string; name: string },
): Promise<QueueState> {
  const { items } = await readQueue();
  return writeQueue([
    ...items,
    {
      localId: crypto.randomUUID(),
      capturedAt,
      capturedById: capturedBy.id,
      capturedByName: capturedBy.name,
      payload,
    },
  ]);
}

export async function removeFromQueue(localId: string): Promise<QueueState> {
  const { items } = await readQueue();
  return writeQueue(items.filter((item) => item.localId !== localId));
}

export async function markRejected(
  localId: string,
  reason: string,
): Promise<QueueState> {
  const { items } = await readQueue();
  return writeQueue(
    items.map((item) =>
      item.localId === localId ? { ...item, rejectedReason: reason } : item,
    ),
  );
}

/**
 * Whether a failed request is worth keeping.
 *
 * No response at all means the request never landed — offline, DNS, a dead
 * gateway — and is exactly what the queue is for. A 5xx reached the server but
 * the server could not deal with it, which may pass. Anything else is the
 * server saying no on the merits: a 400 will be a 400 again in an hour, and a
 * 401 is handled by the interceptor.
 */
export function isRetryable(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === undefined) return true;
  return status >= 500;
}
