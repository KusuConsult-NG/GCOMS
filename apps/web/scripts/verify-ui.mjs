/**
 * Drives the real app in a real browser and captures what it looks like.
 *
 * Everything in this repo up to now has been verified by curl against the API or
 * by reading built CSS. Neither shows whether a page renders, whether dark mode
 * is legible, or whether a console error fires after hydration. This does.
 *
 * Usage: node scripts/verify-ui.mjs [outputDir]
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.UI_EMAIL ?? 'executive@gcoms.org';
const PASSWORD = process.env.UI_PASSWORD ?? 'Password123!';
const OUT = process.argv[2] ?? '/tmp/gcoms-ui';

const PAGES = [
  ['dashboard', '/'],
  ['patients', '/patients'],
  ['hr', '/hr'],
  ['finance', '/finance'],
  ['grants', '/grants'],
  ['projects', '/projects'],
  ['inventory', '/inventory'],
  ['governance', '/governance'],
  ['procurement', '/procurement'],
  ['system-admin', '/system-admin'],
  ['registration', '/registration'],
];

const problems = [];

async function main() {
  await mkdir(OUT, { recursive: true });
  // Use the Chrome already installed on this machine rather than downloading a
  // second browser; fall back to Playwright's bundled build if it is present.
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch {
    browser = await chromium.launch();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Anything the app logs as an error, or any request that fails, is a defect
  // that a curl smoke test cannot see.
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text().slice(0, 200)}`);
  });
  page.on('pageerror', (err) => problems.push(`uncaught: ${err.message.slice(0, 200)}`));
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      problems.push(`http ${res.status()} ${res.url().replace(BASE, '')}`);
    }
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/00-login.png` });

  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') {
      await page.evaluate(() => {
        localStorage.setItem('gcoms-theme', 'dark');
        document.documentElement.classList.add('dark');
      });
    }
    for (const [name, path] of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(700); // let client fetches paint
      await page.screenshot({ path: `${OUT}/${theme}-${name}.png`, fullPage: false });
    }
  }

  // Report what the DOM actually holds, not what the API returned.
  await page.goto(`${BASE}/patients`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const rows = await page.locator('table tbody tr').count();
  console.log(`patients table rows rendered: ${rows}`);

  await browser.close();

  console.log(`\nscreenshots: ${OUT}`);
  if (problems.length === 0) {
    console.log('no console errors, uncaught exceptions or failed requests');
  } else {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of [...new Set(problems)].slice(0, 25)) console.log(`  - ${p}`);
  }
}

main().catch((err) => {
  console.error('verification run failed:', err.message);
  process.exit(1);
});
