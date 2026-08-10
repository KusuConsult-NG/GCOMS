/**
 * Measures text contrast on every route, in both themes, and fails on WCAG AA.
 *
 * verify-ui.mjs catches pages that throw, pages that render nothing, and CSP
 * violations. It cannot catch the failure this application is most exposed to:
 * text that is present, correct and unreadable. The app carries hundreds of raw
 * Tailwind colour utilities — `text-slate-500`, `bg-white`, `border-gray-200` —
 * which are fixed values that do not answer to the theme, so a card that reads
 * perfectly in light mode can be dark-grey-on-near-black in dark mode with
 * nothing in the console to say so.
 *
 * That makes converting those utilities to tokens a change whose whole point is
 * invisible to every other check in the repository. This is the check that sees
 * it. Run it before and after: the count must not go up.
 *
 * AA thresholds: 4.5:1 for body text, 3:1 for large text (>=24px, or >=18.66px
 * bold), per WCAG 2.1 SC 1.4.3.
 *
 * Usage:
 *   node scripts/verify-contrast.mjs [--json out.json]
 *   QUICK=1 node scripts/verify-contrast.mjs     # light theme only
 */
import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const PASSWORD = process.env.UI_PASSWORD ?? 'Password123!';
const EMAIL = process.env.UI_EMAIL ?? 'executive@gcoms.org';
const QUICK = process.env.QUICK === '1';

const jsonIndex = process.argv.indexOf('--json');
const JSON_OUT = jsonIndex === -1 ? null : process.argv[jsonIndex + 1];

const ROUTES = [
  '/', '/patients', '/registration', '/clinical', '/screenings', '/referrals',
  '/follow-ups', '/navigation', '/communities', '/outreach', '/volunteers',
  '/hr', '/finance', '/procurement', '/inventory', '/grants', '/projects',
  '/documents', '/governance', '/strategy', '/reports', '/research',
  '/system-admin', '/admin-mgmt',
];

/**
 * Runs in the page. Returns one entry per text node that fails AA.
 *
 * The interesting part is resolving the background: `getComputedStyle` reports
 * `rgba(0, 0, 0, 0)` for anything that has not set one, so the real backdrop
 * has to be found by walking up the tree and compositing the translucent layers
 * on the way. Comparing text against a transparent background is how automated
 * contrast checks produce results that look precise and mean nothing.
 */
function audit() {
  /**
   * Resolve any CSS colour to sRGB with alpha, by painting it.
   *
   * Not a regex. Tailwind 4 defines its palette in oklch and Chromium returns
   * `oklch(0.208 0.042 265.755)` from getComputedStyle, which an rgb() pattern
   * does not match — so a parser built on one silently drops every palette
   * colour in the application. The first version of this script did exactly
   * that, and the effect was not a crash but a lie: a slate-900 button with
   * white text was reported as white-on-white at 1.00:1, because its own
   * background had been skipped and the white card behind it measured instead.
   *
   * Painting the colour twice, once over black and once over white, recovers
   * the alpha from the difference and the colour from either — exactly, for any
   * syntax the browser itself accepts.
   */
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const pen = probe.getContext('2d', { willReadFrequently: true });

  const paint = (backdropColour, colour) => {
    pen.clearRect(0, 0, 1, 1);
    pen.fillStyle = backdropColour;
    pen.fillRect(0, 0, 1, 1);
    pen.fillStyle = colour;
    pen.fillRect(0, 0, 1, 1);
    return pen.getImageData(0, 0, 1, 1).data;
  };

  const parse = (colour) => {
    if (!colour || colour === 'none') return null;
    let onBlack;
    let onWhite;
    try {
      onBlack = paint('#000000', colour);
      onWhite = paint('#ffffff', colour);
    } catch {
      return null;
    }
    // Over white the uncovered part contributes 255; over black it contributes
    // 0. The gap is therefore 255 * (1 - alpha).
    const alpha = 1 - (onWhite[0] - onBlack[0]) / 255;
    if (alpha <= 0.002) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: onBlack[0] / alpha,
      g: onBlack[1] / alpha,
      b: onBlack[2] / alpha,
      a: alpha,
    };
  };

  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const luminance = ({ r, g, b }) => {
    const channel = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const ratio = (a, b) => {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  /** Composite every ancestor background down to an opaque colour. */
  const backdrop = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a === 1) break;
      }
    }
    // Nothing opaque found: the canvas is white, which is what a browser paints.
    let result = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) result = over(layers[i], result);
    return result;
  };

  const failures = [];
  const seen = new Set();

  for (const element of document.querySelectorAll('body *')) {
    // Only elements with their own visible text, so a wrapper is not blamed for
    // its children's colours.
    const ownText = [...element.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    if (!ownText) continue;

    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    if (Number(style.opacity) === 0) continue;
    const box = element.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;

    const fg = parse(style.color);
    if (!fg) continue;
    const bg = backdrop(element);
    const composited = fg.a < 1 ? over(fg, bg) : fg;
    const contrast = ratio(composited, bg);

    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;
    if (contrast >= required) continue;

    // Placeholder-only inputs and decorative glyphs produce a lot of noise at
    // the same colour; one entry per colour pair per selector is enough to act
    // on.
    const key = `${element.tagName}|${style.color}|${Math.round(contrast * 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    failures.push({
      text: ownText.slice(0, 60),
      tag: element.tagName.toLowerCase(),
      className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
      color: style.color,
      background: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      ratio: Math.round(contrast * 100) / 100,
      required,
      fontSize: size,
    });
  }
  return failures;
}

async function signIn(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('gcoms-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
}

async function launch() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (executablePath) return chromium.launch({ executablePath });
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    return chromium.launch();
  }
}

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const all = [];
try {
  await signIn(page);
  for (const theme of QUICK ? ['light'] : ['light', 'dark']) {
    await setTheme(page, theme);
    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      // The workspaces fetch after hydration; measuring before that lands
      // reports on a loading spinner instead of the page.
      await page.waitForTimeout(1200);
      const failures = await page.evaluate(audit);
      for (const f of failures) all.push({ theme, route, ...f });
    }
  }
} finally {
  await browser.close();
}

const byTheme = { light: 0, dark: 0 };
for (const f of all) byTheme[f.theme]++;

console.log(`\ncontrast failures: ${all.length} (light ${byTheme.light}, dark ${byTheme.dark})`);
if (all.length) {
  const worst = [...all].sort((a, b) => a.ratio - b.ratio).slice(0, 25);
  console.log('\nworst 25:');
  for (const f of worst) {
    console.log(
      `  ${f.ratio.toFixed(2)}:1 (needs ${f.required})  [${f.theme} ${f.route}]  ` +
        `<${f.tag}> "${f.text}"\n      ${f.color} on ${f.background}  ${f.className}`,
    );
  }
}

if (JSON_OUT) {
  await writeFile(JSON_OUT, JSON.stringify(all, null, 2));
  console.log(`\nfull report: ${JSON_OUT}`);
}

/*
 * A hard gate, now that the count is zero.
 *
 * It started as a measurement tool, because a number is only meaningful next to
 * the one from before the change: the first run found 109 failures over 10
 * distinct defects, and failing on that would only have blocked every build
 * until they were fixed. They are fixed. From here the useful question is not
 * "how many" but "did this change add one", and that is a yes-or-no.
 *
 * Zero is the right threshold rather than a ratchet, for the same reason the API
 * lints at --max-warnings 0: a budget above zero is a budget someone spends.
 */
if (all.length > 0) {
  console.error(
    `\n${all.length} element(s) below the WCAG AA contrast floor. ` +
      'Fix the colours, or raise the tokens they resolve to — see globals.css.',
  );
  process.exit(1);
}
console.log('every measured element clears WCAG AA in both themes');
