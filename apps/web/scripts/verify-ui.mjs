/**
 * Drives the real app in a real browser and reports what actually breaks.
 *
 * Curl against the API cannot see whether a page renders, whether dark mode is
 * legible, or whether something throws after hydration. This can.
 *
 * Two sweeps:
 *   1. Every dashboard route, as an executive, in both themes. Catches
 *      page-level defects.
 *   2. Every role's landing dashboard. The home route renders a different
 *      workspace component per role, so a crash in one is invisible from any
 *      other — which is how an uncaught React error sat in ExecutiveWorkspace
 *      while every other page looked fine.
 *
 * Usage:
 *   node scripts/verify-ui.mjs [outputDir]
 *   QUICK=1 node scripts/verify-ui.mjs     # executive + light theme only
 */
import { chromium } from 'playwright';
import { mkdir, readFile } from 'fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const PASSWORD = process.env.UI_PASSWORD ?? 'Password123!';
const OUT = process.argv[2] ?? '/tmp/gcoms-ui';
const QUICK = process.env.QUICK === '1';

const ROUTES = [
  '/', '/patients', '/registration', '/clinical', '/screenings', '/referrals',
  '/follow-ups', '/navigation', '/communities', '/outreach', '/volunteers',
  '/hr', '/finance', '/procurement', '/inventory', '/grants', '/projects',
  '/documents', '/governance', '/strategy', '/reports', '/research',
  '/system-admin', '/admin-mgmt', '/mobile-preview',
];

/** Every role, because each lands on a different workspace component. */
const ROLES = [
  ['executive', 'executive@gcoms.org'],
  ['system-admin', 'admin@gcoms.org'],
  ['clinician', 'clinician@gcoms.org'],
  ['doctor', 'doctor@gcoms.org'],
  ['nurse', 'nurse@gcoms.org'],
  ['volunteer', 'volunteer@gcoms.org'],
  ['field-officer', 'field@gcoms.org'],
  ['finance', 'finance@gcoms.org'],
  ['hr', 'hr@gcoms.org'],
  ['procurement', 'procurement@gcoms.org'],
  ['grant-manager', 'grant_manager@gcoms.org'],
  ['project-manager', 'project_manager@gcoms.org'],
  ['inventory-manager', 'inventory_manager@gcoms.org'],
  // The seven the seed did not create, and which therefore nothing drove. Four
  // of them reached an empty sidebar; a sweep that skips a role cannot see that.
  ['board', 'board@gcoms.org'],
  ['admin', 'admin_officer@gcoms.org'],
  ['chw', 'chw@gcoms.org'],
  ['data-officer', 'data_officer@gcoms.org'],
  ['document-officer', 'document_officer@gcoms.org'],
  ['programme-manager', 'programme_manager@gcoms.org'],
  ['research-officer', 'research_officer@gcoms.org'],
];

const problems = [];
let current = 'startup';

function watch(page) {
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // A blocked script reports as an ordinary console error and nothing throws,
    // so without singling it out a CSP that breaks the whole app still leaves a
    // green run. This is the only check covering the nonce in proxy.ts.
    const tag = /Content Security Policy|Refused to (execute|load|apply|connect)/i.test(text)
      ? 'CSP'
      : 'console';
    problems.push([current, `${tag}: ${text.slice(0, 160)}`]);
  });
  page.on('pageerror', (e) => problems.push([current, `UNCAUGHT: ${e.message.slice(0, 160)}`]));
  page.on('response', (r) => {
    // 401/403 are legitimate here: a role hitting a module it may not read is
    // the RBAC working, and the page shows an access-denied state.
    if (r.status() >= 500 && !r.url().includes('favicon')) {
      problems.push([current, `HTTP ${r.status()} ${r.url().replace(BASE, '')}`]);
    }
  });
}

/**
 * That the server is serving the build that is on disk.
 *
 * `next start` reads .next once and renames its process to `next-server`, so
 * `pkill -f "next start"` misses it and a rebuild leaves an old server serving
 * HTML that references chunk filenames no longer present. Every page then fails
 * to hydrate, and the sweep reports a wall of "Loading chunk N failed" and
 * MIME-type refusals that look like a CSP defect in the application.
 *
 * That has now cost three runs, twice being read as a real regression. So it is
 * checked once, up front, and the run stops rather than producing findings about
 * a build nobody is looking at.
 */
async function assertServerIsCurrent(page) {
  let onDisk;
  try {
    onDisk = (await readFile('.next/BUILD_ID', 'utf8')).trim();
  } catch {
    return; // No local build to compare against (e.g. a remote BASE_URL).
  }

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const served = await page.evaluate(
    () => window.__NEXT_DATA__?.buildId ?? null,
  );
  const html = await page.content();
  const current = served
    ? served === onDisk
    : html.includes(onDisk) || html.includes(`/_next/static/${onDisk}/`);

  if (!current) {
    throw new Error(
      `the server is serving a different build than .next on disk ` +
        `(disk ${onDisk}, served ${served ?? 'unknown'}). ` +
        `Restart it: next start renames its process to "next-server", so ` +
        `pkill -f "next start" does not stop it — kill it by pid.`,
    );
  }
}

async function signIn(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('gcoms-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
}

/** Flags a page that rendered essentially nothing — a silent blank screen. */
async function contentSize(page) {
  return page.evaluate(() => document.body.innerText.trim().length);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let browser;
  // PLAYWRIGHT_CHROMIUM_EXECUTABLE first, because neither fallback below can
  // rescue the case it exists for: a prepared image carrying a Chromium build
  // whose revision does not match the pinned Playwright. There, the bundled
  // launch looks for a revision that was never downloaded and `channel: 'chrome'`
  // finds no system Chrome, so the sweep cannot run at all without an explicit
  // path.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (executablePath) {
    browser = await chromium.launch({ executablePath });
  } else {
    try {
      browser = await chromium.launch({ channel: 'chrome' });
    } catch {
      browser = await chromium.launch();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await assertServerIsCurrent(page);
  watch(page);

  const thin = [];

  // ---- Sweep 1: every route, as an executive ----
  await signIn(page, 'executive@gcoms.org');
  for (const theme of QUICK ? ['light'] : ['light', 'dark']) {
    await setTheme(page, theme);
    for (const route of ROUTES) {
      const name = route === '/' ? 'dashboard' : route.slice(1);
      current = `${theme} ${route}`;
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const size = await contentSize(page);
      if (size < 200) thin.push(`${theme} ${route} (${size} chars of text)`);
      await page.screenshot({ path: `${OUT}/${theme}-${name}.png` });
    }
  }

  // ---- Sweep 2: every role's landing workspace ----
  const roleNotes = [];
  for (const [label, email] of ROLES) {
    current = `role:${label} /`;
    try {
      await signIn(page, email);
    } catch {
      problems.push([current, 'could not sign in']);
      continue;
    }
    await setTheme(page, 'light');
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const size = await contentSize(page);
    if (size < 200) thin.push(`role:${label} / (${size} chars)`);
    const heading = await page
      .locator('h1')
      .first()
      .innerText()
      .catch(() => '(no h1)');
    roleNotes.push(`${label.padEnd(18)} ${heading.replace(/\n/g, ' ').slice(0, 60)}`);
    await page.screenshot({ path: `${OUT}/role-${label}.png` });
  }

  await browser.close();

  console.log(`\nscreenshots: ${OUT}`);
  console.log('\nrole landing pages:');
  for (const n of roleNotes) console.log(`  ${n}`);

  if (thin.length) {
    console.log(`\n${thin.length} page(s) rendered almost no text:`);
    for (const t of thin) console.log(`  - ${t}`);
  }

  const unique = [...new Map(problems.map(([c, m]) => [`${c}|${m}`, [c, m]])).values()];
  if (!unique.length) {
    console.log('\nno console errors, uncaught exceptions or 5xx responses');
  } else {
    console.log(`\n${unique.length} problem(s):`);
    for (const [where, what] of unique.slice(0, 40)) console.log(`  [${where}] ${what}`);
  }
  // Plain console errors stay report-only: they are worth reading but too easy
  // to trip on something transient. An uncaught exception or a CSP violation is
  // neither transient nor survivable, so those fail the run.
  const fatal = unique.filter(([, w]) => w.startsWith('UNCAUGHT') || w.startsWith('CSP'));
  if (fatal.length) {
    console.log(`\n${fatal.length} of those fail the run:`);
    for (const [where, what] of fatal) console.log(`  [${where}] ${what}`);
  }
  process.exitCode = fatal.length ? 1 : 0;
}

main().catch((err) => {
  console.error('verification run failed:', err.message);
  process.exit(1);
});
