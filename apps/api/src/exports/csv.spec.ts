import { Prisma } from '@prisma/client';
import { toCsv } from './csv';

/**
 * These lock the two things this module exists for: that a value survives the
 * round trip intact, and that a value which looks like a formula cannot execute
 * when the file is opened.
 */
describe('toCsv', () => {
  /** Strips the BOM and splits into lines, so assertions read plainly. */
  function lines(csv: string): string[] {
    return csv
      .replace(/^\uFEFF/, '')
      .trimEnd()
      .split('\r\n');
  }

  it('quotes every field and doubles internal quotes', () => {
    const out = lines(toCsv([{ note: 'She said "no", then left' }]));
    expect(out[1]).toBe('"She said ""no"", then left"');
  });

  it('keeps a comma or newline inside one field', () => {
    const out = lines(toCsv([{ address: '12 Main St, Kaduna\nNigeria' }]));
    // The embedded newline stays inside the quoted field rather than starting a
    // new record, which is the whole point of quoting.
    expect(out.slice(1).join('\r\n')).toBe('"12 Main St, Kaduna\nNigeria"');
  });

  describe('formula injection', () => {
    it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\tcmd', '\rcmd'])(
      'neutralises a cell starting with %j',
      (payload) => {
        const [, row] = lines(toCsv([{ v: payload }]));
        expect(row).toBe(`"'${payload}"`);
      },
    );

    it('leaves an ordinary value alone', () => {
      expect(lines(toCsv([{ v: 'Kaduna' }]))[1]).toBe('"Kaduna"');
    });
  });

  describe('object values', () => {
    it('renders a Decimal as its number, not as JSON', () => {
      // A money column arrives as Prisma.Decimal. JSON.stringify would wrap it
      // in its own quotes and the field would land as """0.20""".
      const [, row] = lines(toCsv([{ amount: new Prisma.Decimal('0.20') }]));
      expect(row).toBe('"0.2"');
    });

    it('renders a Date as an ISO timestamp', () => {
      const [, row] = lines(
        toCsv([{ at: new Date('2026-01-02T03:04:05.000Z') }]),
      );
      expect(row).toBe('"2026-01-02T03:04:05.000Z"');
    });

    it('falls back to JSON for a plain object rather than [object Object]', () => {
      const [, row] = lines(toCsv([{ meta: { a: 1 } }]));
      expect(row).not.toContain('[object Object]');
      expect(row).toBe('"{""a"":1}"');
    });

    it('renders an array through its own toString', () => {
      expect(lines(toCsv([{ tags: ['a', 'b'] }]))[1]).toBe('"a,b"');
    });
  });

  it('writes an empty field for null and undefined', () => {
    const [, row] = lines(toCsv([{ a: null, b: undefined }]));
    expect(row).toBe('"",""');
  });

  it('uses the given column order, and omits columns not asked for', () => {
    const out = lines(toCsv([{ b: 2, a: 1, secret: 'x' }], ['a', 'b']));
    expect(out[0]).toBe('"a","b"');
    expect(out[1]).toBe('"1","2"');
  });

  it('emits headers only when there are no rows', () => {
    expect(lines(toCsv([], ['a', 'b']))).toEqual(['"a","b"']);
  });

  it('starts with a BOM and separates records with CRLF, per RFC 4180', () => {
    const csv = toCsv([{ a: 1 }, { a: 2 }]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"1"\r\n"2"');
  });
});
