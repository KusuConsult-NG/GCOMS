/**
 * That no screen states a figure it did not get from the API.
 *
 * This kept happening, in two shapes.
 *
 * The first is a bare number in a KPI card. The reports screen — the one whose
 * entire purpose is reporting — showed "Total Community Reach 1,845",
 * "Under Care Navigation 184" and "Hospital Referrals 51", none of which came
 * from anywhere, above an impact breakdown whose four counts and four
 * percentages were also literals. The patient-navigation screen showed a
 * caseload of 184 and an 89% completion rate above a table of the viewer's real
 * referrals. The research screen claimed 1,240 survey respondents and "100%
 * Valid" IRB approvals — a compliance claim about human-subjects research, made
 * by a page with no knowledge of any approval. A volunteer's first day showed
 * "Patients Registered Today: 14".
 *
 * The second is worse, because it hides behind a real field: `summary?.
 * totalScreenings || 462`. Zero is falsy, so a programme that has screened
 * nobody reports 462 screenings — the fabrication appears exactly when the real
 * figure would have been most informative. `outreaches.length || 3` did the
 * same for outreach drives.
 *
 * So: no fabricated fallback, and no bare number inside the tabular-nums
 * elements these dashboards use for figures. `|| 0` is fine — zero is what an
 * empty count is.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..');

const files: string[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.tsx')) files.push(full);
  }
};
walk(SRC);

const named = (file: string) => file.slice(file.indexOf('/src/') + 1);

/**
 * `/mobile-preview` is a design mockup of the field app, deliberately unlinked
 * from the sidebar and reachable only by typing the URL. Its numbers are part
 * of the mockup rather than claims about the organisation.
 */
const MOCKUP = '/mobile-preview/';

const screens = files.filter((f) => !f.includes(MOCKUP));

describe('figures on screen', () => {
  it('finds the screens to check', () => {
    // A scan that matched nothing would pass silently, which is the failure
    // mode of every check in this file.
    expect(screens.length).toBeGreaterThan(20);
  });

  it('substitutes no invented number for a missing one', () => {
    // `x || 0` is allowed and `x ?? 0` is preferred; `x || 462` is not.
    const inventedFallback = /\|\|\s*[1-9]\d*\s*[}) ]/;
    const offenders = screens
      .filter((f) => {
        for (const line of readFileSync(f, 'utf8').split('\n')) {
          // Only rendered expressions — a `|| 30` in a timeout or a retry
          // count is not a claim about anything.
          if (!line.includes('{') && !line.includes('return')) continue;
          if (inventedFallback.test(line)) return true;
        }
        return false;
      })
      .map(named);
    expect(offenders).toEqual([]);
  });

  it('renders no bare number as a figure', () => {
    /*
     * The KPI idiom in this app is a `tabular-nums` element containing the
     * value. A literal there is a number the screen is asserting on its own
     * authority.
     */
    const bareFigure =
      /tabular-nums[^>]*>\s*(?:₦\s*)?[0-9][0-9,. ]*\s*(?:%|\/|<)/;
    const offenders = screens
      .filter((f) => bareFigure.test(readFileSync(f, 'utf8')))
      .map(named);
    expect(offenders).toEqual([]);
  });

  it('states no completion or coverage percentage as a literal', () => {
    // "89%", "100% Valid", "Est. 45%" — the shape that reads as a measurement
    // and is not one, whether or not it sits in a tabular-nums element.
    const literalPercent = />\s*\d{1,3}%[^<{]*</;
    const offenders = screens
      .filter((f) => literalPercent.test(readFileSync(f, 'utf8')))
      .map(named);
    expect(offenders).toEqual([]);
  });
});
