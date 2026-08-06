import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Human-readable reference numbers, allocated by the server.
 *
 * RFQs, goods received notes and contracts all carry one, and all three used to
 * be — or were about to be — generated in the browser. That is the wrong place
 * twice over: the uniqueness constraint lives in the database, so the value that
 * has to satisfy it should be produced next to the constraint; and a client
 * cannot see the other clients, so anything it invents is a guess.
 */

/** `RFQ-2026-` — the per-year namespace a sequence counts within. */
export function referencePrefix(kind: string, now: Date): string {
  return `${kind}-${now.getFullYear()}-`;
}

/**
 * The next number in a sequence, compared numerically.
 *
 * Ordering by `reference: 'desc'` in the query and taking the first row looks
 * equivalent and is not: it is a string comparison, so a three-digit reference
 * left over from an earlier scheme ("RFQ-2026-004") sorts above a four-digit one
 * ("RFQ-2026-0005"). The highest reference then reads as 4, the next allocated
 * is 5, and 5 is already taken — which is exactly how every create after the
 * first came to fail.
 *
 * `offset` advances on retry so a caller that lost a race takes the following
 * number instead of recomputing the one it just collided with.
 */
export function allocateReference(
  prefix: string,
  existing: readonly string[],
  offset = 0,
): string {
  const highest = existing.reduce((max, reference) => {
    const value = Number(reference.slice(prefix.length));
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
  return `${prefix}${String(highest + 1 + offset).padStart(4, '0')}`;
}

/** How many times to retry before giving up rather than looping. */
const MAX_ATTEMPTS = 5;

/**
 * Allocates a reference and creates the record, retrying if another request
 * took the number first.
 *
 * The retry is on the unique constraint rather than on the read, because two
 * requests in the same tick see the same rows and only the database can say who
 * won. Anything that is not a uniqueness violation is rethrown untouched — a
 * dropped connection must not be mistaken for a busy sequence.
 */
export async function createWithReference<T>(
  prefix: string,
  listExisting: (prefix: string) => Promise<{ reference: string }[]>,
  create: (reference: string) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const taken = await listExisting(prefix);
    const reference = allocateReference(
      prefix,
      taken.map((row) => row.reference),
      attempt,
    );
    try {
      return await create(reference);
    } catch (error) {
      const clashed =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';
      if (!clashed) throw error;
    }
  }
  throw new ConflictException(
    'Could not allocate a reference number. Please try again.',
  );
}
