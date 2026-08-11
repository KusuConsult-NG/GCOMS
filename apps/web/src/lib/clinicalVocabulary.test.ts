/**
 * That the values these forms offer are values the API will accept.
 *
 * The API now validates cancerType and result against a fixed list, which turns
 * a vocabulary mismatch from a silent data problem into a 400 on submit. So
 * these have to be read off the API's own source rather than compared with a
 * second hand-written copy — which is exactly what the four-option screening
 * form was.
 *
 * The counts are asserted by name because the spec states them: seventeen cancer
 * categories, seventeen Plateau State LGAs. Both were claimed and only one was
 * true on the screen that mattered.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CANCER_TYPES,
  PLATEAU_LGAS,
  SCREENING_RESULTS,
  SCREENING_RESULT_LABEL,
} from './clinicalVocabulary';

const HERE = dirname(fileURLToPath(import.meta.url));
const API_CONSTANTS = join(HERE, '../../../api/src/auth/roles.constants.ts');

/** Pulls `export const NAME = [ ... ] as const;` out of the API's source. */
function apiList(name: string): string[] {
  expect(existsSync(API_CONSTANTS), `expected ${API_CONSTANTS}`).toBe(true);
  const source = readFileSync(API_CONSTANTS, 'utf8');
  const found = new RegExp(
    `export const ${name} = \\[([\\s\\S]*?)\\] as const;`,
  ).exec(source);
  expect(found, `no \`export const ${name}\` in the API constants`).not.toBe(
    null,
  );
  // Both quote styles: "Quan'Pan LGA" cannot be single-quoted without escaping.
  return [...found![1].matchAll(/'([^']*)'|"([^"]*)"/g)]
    .map((m) => m[1] ?? m[2])
    .filter((v) => v.length > 0);
}

describe('cancer categories', () => {
  it('are the seventeen the spec calls for', () => {
    // The screening form offered four of them, so thirteen could not be
    // recorded from the screen that records screenings.
    expect(CANCER_TYPES).toHaveLength(17);
  });

  it('match the list the API validates against', () => {
    expect([...CANCER_TYPES]).toEqual(apiList('CANCER_TYPES'));
  });

  it('spells cervical one way', () => {
    // Two screens wrote 'Cervical Cancer' and 'Cervical Cancer (VIA / Pap)'
    // into the same column.
    const cervical = CANCER_TYPES.filter((t) =>
      t.toLowerCase().includes('cervical'),
    );
    expect(cervical).toEqual(['Cervical Cancer (VIA / Pap)']);
  });

  it('keeps the substrings the risk score weights on', () => {
    // ScreeningsService.calculateRiskScore adds weight for 'cervical' and
    // 'breast'. Renaming a category out from under it would silently change
    // every risk score computed afterwards.
    const lower = CANCER_TYPES.map((t) => t.toLowerCase());
    expect(lower.some((t) => t.includes('cervical'))).toBe(true);
    expect(lower.some((t) => t.includes('breast'))).toBe(true);
  });
});

describe('screening results', () => {
  it('match the list the API validates against', () => {
    expect([...SCREENING_RESULTS]).toEqual(apiList('SCREENING_RESULTS'));
  });

  it('keeps every positive result findable by the counts that look for one', () => {
    /*
     * Every positive-case figure in this system is a substring match:
     * `LOWER(result) LIKE '%positive%'` in the LGA breakdown, and
     * `.includes('POSITIVE')` in the risk score and on the clinical dashboard.
     * A result meaning positive and not containing the word is a case that
     * happened and is in no count — the same shape as a follow-up status
     * outside its vocabulary.
     */
    const positives = SCREENING_RESULTS.filter((r) =>
      r.toLowerCase().includes('positive'),
    );
    expect(positives.length).toBeGreaterThan(0);
    const negatives = SCREENING_RESULTS.filter(
      (r) => !r.toLowerCase().includes('positive'),
    );
    expect([...negatives]).toEqual(['Negative', 'Suspicious']);
  });

  it('labels every one of them', () => {
    for (const result of SCREENING_RESULTS) {
      expect(SCREENING_RESULT_LABEL[result]).toBeTruthy();
    }
  });
});

describe('Plateau State LGAs', () => {
  it('are all seventeen', () => {
    expect(PLATEAU_LGAS).toHaveLength(17);
  });

  it('match the list the API holds', () => {
    expect([...PLATEAU_LGAS]).toEqual(apiList('PLATEAU_LGAS'));
  });

  it('holds no duplicate, which would split a district in the breakdown', () => {
    expect(new Set(PLATEAU_LGAS).size).toBe(PLATEAU_LGAS.length);
  });
});

describe('no screen declares its own copy', () => {
  /*
   * Three files declared PLATEAU_LGAS and two declared a cancer list. The copies
   * were identical on the day they were written, which is the only day that
   * matters less than every day after it.
   */
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx')) files.push(full);
    }
  };
  walk(join(HERE, '..'));

  const offenders = (pattern: RegExp) =>
    files
      .filter((f) => pattern.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(f.indexOf('/src/') + 1));

  it('declares no LGA list in a component', () => {
    expect(offenders(/const\s+\w*(?:LGAS|Lgas)\w*\s*=\s*\[/)).toEqual([]);
  });

  it('declares no cancer-type list in a component', () => {
    expect(
      offenders(/const\s+\w*(?:cancerTypes|CANCER_TYPES)\w*\s*=\s*\[/),
    ).toEqual([]);
  });

  it('offers no hard-coded cancer type as an option value', () => {
    // The screening form's four `<option value="Cervical Cancer">` entries,
    // which is how the short spellings reached the column.
    expect(
      offenders(/<option\s+value="(?:Cervical|Breast|Prostate|Colorectal)[^"]*"/),
    ).toEqual([]);
  });
});
