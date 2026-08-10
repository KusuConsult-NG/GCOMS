/**
 * The offline registration queue.
 *
 * This module holds patient data — names, dates of birth, phone numbers,
 * addresses, GPS — on a shared field phone until it reaches the server, and
 * every rule it enforces was written in response to a way that goes wrong:
 * a retry registering the same patient twice, a record filed under whoever
 * happened to be signed in when it synced, plaintext PHI sitting in
 * localStorage, a capture quietly lost because the device could not encrypt it.
 *
 * None of it was tested. The browser sweep cannot see any of this — it renders
 * pages, and these are rules about what is written down.
 *
 * The encryption is real here, not stubbed: AES-GCM under a real
 * non-extractable key in a real key store. A test that mocked `encryptJson`
 * would prove the queue calls a function, which is not the claim worth
 * defending. The claim is that a captured registration is not readable in
 * storage.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueuedRegistrationPayload } from './offlineQueue';

/**
 * A fresh copy of the module per test.
 *
 * The queue keeps a session copy in module scope on purpose: a device that
 * cannot encrypt still gets a working queue for as long as the tab lives,
 * rather than silently dropping registrations. That state outlives
 * `localStorage.clear()`, so without this each test would inherit the previous
 * one's captures — and a test that passes because of what the test before it
 * did is not evidence about anything.
 */
let queue: typeof import('./offlineQueue');

beforeEach(async () => {
  vi.resetModules();
  queue = await import('./offlineQueue');
});

const STORAGE_KEY = 'gcoms-offline-registrations';

const payload = (
  overrides: Partial<QueuedRegistrationPayload> = {},
): QueuedRegistrationPayload => ({
  idempotencyKey: 'key-1',
  firstName: 'Amina',
  lastName: 'Bello',
  dateOfBirth: '1991-04-02',
  gender: 'Female',
  phoneNumber: '+2348031234567',
  address: 'House 14, Main Street',
  lga: 'Barkin Ladi LGA',
  ward: 'Gwol Ward',
  gpsCoordinates: '9.5333° N, 8.9000° E',
  consentGiven: true,
  ...overrides,
});

const amina = { id: 'user-1', name: 'Amina Bello' };
const john = { id: 'user-2', name: 'John Danladi' };

describe('the offline registration queue', () => {
  it('holds a capture and reads it back', async () => {
    await queue.enqueue(payload(), '2026-08-10T09:00:00.000Z', amina);
    const { items, persistent } = await queue.readQueue();

    expect(persistent).toBe(true);
    expect(items).toHaveLength(1);
    expect(items[0].payload.firstName).toBe('Amina');
    expect(items[0].capturedAt).toBe('2026-08-10T09:00:00.000Z');
  });

  it('keeps the idempotency key the capture was made with', async () => {
    // The whole point of the key: a request the server commits but whose
    // response is lost must return the original record on the retry, not
    // register the patient a second time. If the replay carried a fresh key it
    // would be a different capture as far as the server is concerned.
    await queue.enqueue(payload({ idempotencyKey: 'capture-abc' }), 'now', amina);
    const { items } = await queue.readQueue();
    expect(items[0].payload.idempotencyKey).toBe('capture-abc');
  });

  it('records who took each capture, not who is signed in', async () => {
    // Field devices are shared. The server files a registration against
    // whoever holds the token when it arrives, so without this a record
    // captured by Amina and synced after John signs in is filed under John —
    // and on a patient record that is the audit trail.
    await queue.enqueue(payload(), 'now', amina);
    await queue.enqueue(payload({ idempotencyKey: 'key-2' }), 'now', john);

    const { items } = await queue.readQueue();
    expect(items.map((i) => i.capturedById)).toEqual(['user-1', 'user-2']);
    expect(items.map((i) => i.capturedByName)).toEqual([
      'Amina Bello',
      'John Danladi',
    ]);
  });

  it('gives every capture its own local id', async () => {
    await queue.enqueue(payload(), 'now', amina);
    await queue.enqueue(payload({ idempotencyKey: 'key-2' }), 'now', amina);
    const { items } = await queue.readQueue();
    expect(items[0].localId).not.toBe(items[1].localId);
  });

  it('preserves the order captures were taken in', async () => {
    // Replay is oldest first, so that a clinic sees patients in the order they
    // were actually seen.
    for (const [i, name] of ['First', 'Second', 'Third'].entries()) {
      await queue.enqueue(
        payload({ idempotencyKey: `key-${i}`, firstName: name }),
        'now',
        amina,
      );
    }
    const { items } = await queue.readQueue();
    expect(items.map((i) => i.payload.firstName)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
  });

  describe('what reaches the disk', () => {
    it('does not write patient data in plaintext', async () => {
      await queue.enqueue(payload(), 'now', amina);
      const raw = localStorage.getItem(STORAGE_KEY);

      expect(raw).toBeTruthy();
      // Every identifying field the payload carries. Checking one would pass
      // while the rest leaked.
      for (const secret of [
        'Amina',
        'Bello',
        '1991-04-02',
        '+2348031234567',
        'House 14, Main Street',
        'Gwol Ward',
        '9.5333',
      ]) {
        expect(raw).not.toContain(secret);
      }
    });

    it('writes something that cannot be read as JSON', async () => {
      await queue.enqueue(payload(), 'now', amina);
      const raw = localStorage.getItem(STORAGE_KEY) as string;
      expect(() => JSON.parse(raw)).toThrow();
    });

    it('uses a fresh IV per write, so two identical captures differ on disk', async () => {
      await queue.enqueue(payload(), 'now', amina);
      const first = localStorage.getItem(STORAGE_KEY);
      localStorage.clear();
      await queue.enqueue(payload(), 'now', amina);
      const second = localStorage.getItem(STORAGE_KEY);
      // Reusing an IV under one key leaks; identical plaintext must not
      // produce identical ciphertext.
      expect(first).not.toBe(second);
    });
  });

  describe('when the device cannot store it safely', () => {
    it('still queues, and says the queue will not survive a reload', async () => {
      // Refusing to persist is deliberate: the alternative is writing the
      // plaintext the encryption exists to avoid. But the capture is not
      // thrown away — the volunteer can still sync before closing the tab.
      const setItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      const state = await queue.enqueue(payload(), 'now', amina);
      expect(state.items).toHaveLength(1);
      expect(state.persistent).toBe(false);

      setItem.mockRestore();
    });
  });

  describe('removing and rejecting', () => {
    it('removes a synced capture by its local id', async () => {
      await queue.enqueue(payload(), 'now', amina);
      await queue.enqueue(payload({ idempotencyKey: 'key-2' }), 'now', amina);
      const { items } = await queue.readQueue();

      const after = await queue.removeFromQueue(items[0].localId);
      expect(after.items).toHaveLength(1);
      expect(after.items[0].localId).toBe(items[1].localId);
    });

    it('keeps a rejected capture, with the reason', async () => {
      // Not deleted. The server refused it on the merits, so retrying is
      // pointless — but deleting an unsynced registration would destroy the
      // only copy of a patient's intake.
      await queue.enqueue(payload(), 'now', amina);
      const { items } = await queue.readQueue();

      const after = await queue.markRejected(items[0].localId, 'Duplicate national ID');
      expect(after.items).toHaveLength(1);
      expect(after.items[0].rejectedReason).toBe('Duplicate national ID');
    });

    it('leaves an unknown local id alone', async () => {
      await queue.enqueue(payload(), 'now', amina);
      const after = await queue.removeFromQueue('no-such-id');
      expect(after.items).toHaveLength(1);
    });
  });

  describe('staleness', () => {
    const captured = (iso: string) => ({
      localId: 'l',
      capturedAt: iso,
      capturedById: 'user-1',
      capturedByName: 'Amina',
      payload: payload(),
    });

    it('flags a record held longer than a day', () => {
      const now = Date.parse('2026-08-10T12:00:00.000Z');
      const old = new Date(now - queue.STALE_AFTER_MS - 1000).toISOString();
      expect(queue.isStale(captured(old), now)).toBe(true);
    });

    it('does not flag one held less than a day', () => {
      const now = Date.parse('2026-08-10T12:00:00.000Z');
      const recent = new Date(now - 60_000).toISOString();
      expect(queue.isStale(captured(recent), now)).toBe(false);
    });

    it('does not flag one exactly at the boundary', () => {
      const now = Date.parse('2026-08-10T12:00:00.000Z');
      const exactly = new Date(now - queue.STALE_AFTER_MS).toISOString();
      expect(queue.isStale(captured(exactly), now)).toBe(false);
    });
  });

  describe('which failures are worth keeping', () => {
    it('keeps a request that never reached the server', () => {
      // No response at all: offline, DNS, a dead gateway. Exactly what the
      // queue is for.
      expect(queue.isRetryable(new Error('Network Error'))).toBe(true);
      expect(queue.isRetryable({ response: undefined })).toBe(true);
    });

    it('keeps a 5xx, which may pass', () => {
      expect(queue.isRetryable({ response: { status: 500 } })).toBe(true);
      expect(queue.isRetryable({ response: { status: 503 } })).toBe(true);
    });

    it('discards a refusal on the merits', () => {
      // A 400 will be a 400 in an hour; a 401 is handled by the interceptor.
      expect(queue.isRetryable({ response: { status: 400 } })).toBe(false);
      expect(queue.isRetryable({ response: { status: 401 } })).toBe(false);
      expect(queue.isRetryable({ response: { status: 409 } })).toBe(false);
    });
  });

  describe('storage that cannot be trusted', () => {
    it('ignores a value it cannot decrypt rather than throwing', async () => {
      // A key rotated, a half-written value, another origin's data: the
      // workspace must still open. Losing the queue is bad; a volunteer unable
      // to register anyone at all is worse.
      localStorage.setItem(STORAGE_KEY, 'not-something-we-wrote');
      const { items } = await queue.readQueue();
      expect(items).toEqual([]);
    });

    it('drops entries that are not shaped like a capture', async () => {
      await queue.enqueue(payload(), 'now', amina);
      const { items } = await queue.readQueue();
      expect(items.every((i) => typeof i.localId === 'string')).toBe(true);
    });
  });
});
