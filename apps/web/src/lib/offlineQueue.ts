/**
 * Field registrations captured while the API was unreachable.
 *
 * The volunteer workspace is used on phones in LGAs where a connection is not a
 * given. Before this, a registration that failed to send was simply refused:
 * the form kept what had been typed and the volunteer had to stand still and
 * retry, or lose it. This holds the record instead and replays it when the
 * connection returns.
 *
 * Two things to be clear about, because neither is solved here:
 *
 * localStorage is not a safe place for patient data. Everything below —
 * names, dates of birth, phone numbers, addresses, GPS — sits unencrypted on
 * the device until it syncs, readable by anything else running in this origin
 * and by anyone holding an unlocked phone. The queue is kept as small and as
 * short-lived as possible for that reason, but that is mitigation, not a fix.
 *
 * Replay can duplicate. If the server commits a registration and the response
 * is lost on the way back, the record stays queued and the retry creates a
 * second patient. Closing that needs an idempotency key the API accepts and
 * de-duplicates on; there is no way to do it from this side alone.
 */

export type QueuedRegistrationPayload = {
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
  payload: QueuedRegistrationPayload;
  /** Set when the server rejected the record outright, so it is not retried in
   *  a loop that cannot succeed. */
  rejectedReason?: string;
};

const KEY = 'gcoms-offline-registrations';

export function readQueue(): QueuedRegistration[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Anything can write to localStorage, including an older version of this
    // app. A malformed queue is dropped rather than crashing the workspace.
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QueuedRegistration =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as QueuedRegistration).localId === 'string' &&
        !!(item as QueuedRegistration).payload,
    );
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedRegistration[]): QueuedRegistration[] {
  if (typeof window === 'undefined') return items;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded, or storage disabled. The caller still gets the list back
    // so the session keeps working; it just will not survive a reload.
  }
  return items;
}

export function enqueue(
  payload: QueuedRegistrationPayload,
  capturedAt: string,
): QueuedRegistration[] {
  const item: QueuedRegistration = {
    localId: crypto.randomUUID(),
    capturedAt,
    payload,
  };
  return writeQueue([...readQueue(), item]);
}

export function removeFromQueue(localId: string): QueuedRegistration[] {
  return writeQueue(readQueue().filter((item) => item.localId !== localId));
}

export function markRejected(localId: string, reason: string): QueuedRegistration[] {
  return writeQueue(
    readQueue().map((item) =>
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
