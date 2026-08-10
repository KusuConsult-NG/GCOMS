'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import {
  enqueue,
  isRetryable,
  markRejected,
  readQueue,
  removeFromQueue,
  type QueuedRegistration,
  type QueuedRegistrationPayload,
} from '@/lib/offlineQueue';

/**
 * The offline registration queue, and everything that drives it.
 *
 * This was written inside VolunteerWorkspace and lived there alone, which meant
 * exactly one of the two field intake forms had it. The other — `/registration`,
 * "Field intake & consent", in the same volunteer section of the sidebar, on the
 * same phones — refused a registration it could not send and told the user to
 * check their connection and try again. Same patient data, same LGAs, no queue.
 *
 * Sharing it is not only about the second form gaining capture. A queue with two
 * producers and one consumer strands records: anything held by `/registration`
 * would sit on the device until the user happened to open the volunteer
 * dashboard, because that is where the replay lived. Both screens run the replay
 * now, so whichever one is open recovers whatever is waiting.
 *
 * What the queue itself does — encryption at rest, idempotency keys, refusing to
 * replay another account's captures — is unchanged and documented in
 * offlineQueue.ts.
 */

export type CaptureIdentity = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type OfflineRegistrations = {
  /** Everything on the device, including other accounts' captures. */
  queue: QueuedRegistration[];
  /** False when the device cannot encrypt: the queue is session-only. */
  persistent: boolean;
  syncing: boolean;
  /** Why the last sync stopped, when it stopped early. */
  syncNote: string;
  /** Local time of the last successful send, or '' if there has not been one. */
  lastSync: string;
  /** True when this account has something worth sending. */
  hasPending: boolean;
  /** Hold a capture that could not be sent. Returns the resulting state. */
  hold: (
    payload: QueuedRegistrationPayload,
  ) => Promise<{ count: number; persistent: boolean }>;
  sync: () => Promise<void>;
  discard: (localId: string) => Promise<void>;
};

/** Whether an item is this account's to send. */
function isMine(item: QueuedRegistration, userId: string): boolean {
  return !item.rejectedReason && item.capturedById === userId;
}

export function useOfflineRegistrations(
  user: CaptureIdentity,
): OfflineRegistrations {
  const [queue, setQueue] = useState<QueuedRegistration[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const [lastSync, setLastSync] = useState('');

  // Re-entrancy is tracked in a ref rather than the state flag so that `sync`
  // keeps a stable identity; the effects below depend on it, and a function
  // that changed every time `syncing` did would re-run them mid-sync.
  const syncingRef = useRef(false);

  const userId = user.id;
  const capturedByName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || '';

  /**
   * Replays the queue oldest first.
   *
   * Stops at the first record that fails for a reason that would fail again —
   * no connection means the next one has no better chance, and continuing would
   * only spend the battery. A record the server rejects outright is kept and
   * flagged instead, so it can be corrected or discarded rather than
   * disappearing.
   */
  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    let state = await readQueue();
    // Records captured by someone else on this shared device are left alone.
    // The server files a registration against whoever is signed in, so syncing
    // them here would put this account's name on another volunteer's work.
    const pending = state.items.filter((item) => isMine(item, userId));
    if (!pending.length) return;

    syncingRef.current = true;
    setSyncing(true);
    setSyncNote('');
    let sent = 0;

    for (const item of pending) {
      try {
        await api.post('/participants', item.payload);
        state = await removeFromQueue(item.localId);
        sent += 1;
      } catch (err) {
        if (isRetryable(err)) {
          setSyncNote(
            sent > 0
              ? `${sent} sent. The rest are still waiting for a connection.`
              : 'Still no connection to the server. The queue is untouched.',
          );
          break;
        }
        state = await markRejected(
          item.localId,
          errorMessage(err, 'The server rejected this record.'),
        );
      }
    }

    setQueue(state.items);
    setPersistent(state.persistent);
    if (sent > 0) setLastSync(new Date().toLocaleTimeString());
    syncingRef.current = false;
    setSyncing(false);
  }, [userId]);

  const hold = useCallback(
    async (payload: QueuedRegistrationPayload) => {
      const state = await enqueue(payload, new Date().toISOString(), {
        id: userId,
        name: capturedByName,
      });
      setQueue(state.items);
      setPersistent(state.persistent);
      return { count: state.items.length, persistent: state.persistent };
    },
    [userId, capturedByName],
  );

  const discard = useCallback(async (localId: string) => {
    const state = await removeFromQueue(localId);
    setQueue(state.items);
    setPersistent(state.persistent);
  }, []);

  /**
   * Load what the device is holding, and send it if there is a connection.
   *
   * The `online` event alone is not enough: it only fires on a transition. A
   * volunteer who captures records with no signal, closes the app, and opens it
   * again somewhere with one gets no such transition, and the queue would sit
   * there until someone thought to press Sync.
   */
  useEffect(() => {
    void readQueue().then(({ items, persistent: canPersist }) => {
      setQueue(items);
      setPersistent(canPersist);
      if (navigator.onLine && items.some((item) => isMine(item, userId))) {
        void sync();
      }
    });
  }, [sync, userId]);

  // The browser tells us when the connection comes back; that is the moment to
  // try, rather than making the user notice and press something.
  useEffect(() => {
    const onOnline = () => {
      void sync();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [sync]);

  return {
    queue,
    persistent,
    syncing,
    syncNote,
    lastSync,
    hasPending: queue.some((item) => isMine(item, userId)),
    hold,
    sync,
    discard,
  };
}
