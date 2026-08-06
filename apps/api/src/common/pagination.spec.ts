import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT, paginate } from './pagination';

describe('paginate', () => {
  it('applies a default cap when nothing is requested', () => {
    // The reason this helper exists: these queries previously returned every
    // row in the table.
    expect(paginate()).toEqual({ take: DEFAULT_LIST_LIMIT, skip: 0 });
    expect(paginate({})).toEqual({ take: DEFAULT_LIST_LIMIT, skip: 0 });
  });

  it('honours an explicit limit and offset', () => {
    expect(paginate({ limit: 10, offset: 20 })).toEqual({ take: 10, skip: 20 });
  });

  it('never exceeds the hard ceiling', () => {
    expect(paginate({ limit: MAX_LIST_LIMIT + 5000 }).take).toBe(
      MAX_LIST_LIMIT,
    );
  });

  it('treats a missing offset as the first page', () => {
    expect(paginate({ limit: 5 }).skip).toBe(0);
  });

  it('keeps the ceiling above the default so the default is reachable', () => {
    expect(MAX_LIST_LIMIT).toBeGreaterThan(DEFAULT_LIST_LIMIT);
  });
});
