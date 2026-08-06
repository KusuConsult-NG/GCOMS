/**
 * Reading arguments back off a jest mock, with a type.
 *
 * `jest.fn()` without type parameters types `mock.calls` as `any[][]`, so every
 * assertion that reaches into a recorded call is unchecked. That matters more in
 * tests than in source: an assertion against a field that has been renamed reads
 * `undefined`, and `expect(undefined).toBe(undefined)`-shaped checks pass. The
 * test then guards nothing while continuing to report green.
 *
 * `callArg` gives the whole argument; `dataOf` the `data` object of a Prisma
 * create/update, which is what most of these assertions actually want.
 */
export function callArg<T>(mock: jest.Mock, call = 0, arg = 0): T {
  const calls = mock.mock.calls as unknown[][];
  if (!calls[call]) {
    throw new Error(
      `Expected the mock to have been called at least ${call + 1} time(s), but it was called ${calls.length}.`,
    );
  }
  return calls[call][arg] as T;
}

/** The `data` payload of the nth Prisma create/update on a mock. */
export function dataOf<T>(mock: jest.Mock, call = 0): T {
  return callArg<{ data: T }>(mock, call).data;
}
