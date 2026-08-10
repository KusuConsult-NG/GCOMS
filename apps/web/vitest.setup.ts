/**
 * The two browser APIs jsdom does not bring, both of which the offline queue
 * genuinely uses.
 *
 * These are shims for the *platform*, not for the code under test. secureStore
 * encrypts with real AES-GCM under a real non-extractable key here, and the
 * queue reads and writes a real key store — which is the point. A test that
 * stubbed `encryptJson` would prove the queue calls a function, not that a
 * captured registration is unreadable in storage.
 */
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { beforeEach } from 'vitest';

// jsdom ships no WebCrypto. Node's is the same standard implementation, and
// non-extractable keys behave as they do in a browser.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

/**
 * Each test starts on a device that has never run the app.
 *
 * Both stores have to go: localStorage holds the queue and IndexedDB holds the
 * key it is encrypted under. Clearing only the first would leave the next test
 * decrypting new data with an old key, which passes for the wrong reason.
 */
beforeEach(async () => {
  localStorage.clear();
  const { IDBFactory } = await import('fake-indexeddb');
  Object.defineProperty(globalThis, 'indexedDB', {
    value: new IDBFactory(),
    configurable: true,
  });
});
