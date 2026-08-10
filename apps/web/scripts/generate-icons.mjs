/**
 * Generates the PWA icons from the foundation logo.
 *
 * manifest.json had been pointing at icon-192x192.png and icon-512x512.png
 * since it was written, and neither file ever existed — so every install prompt
 * failed on a missing icon, silently, because a manifest that cannot load its
 * icons is simply not installable and browsers do not say so out loud.
 *
 * The icons are not the logo. georgel-logo.png is a wide horizontal lockup —
 * ribbon, "GEORGEL CANCER FOUNDATION", and a tagline — inside a 1024px square
 * with wide margins. Shrunk to 192px the wordmark is a grey smear. So this
 * takes the ribbon out of it and centres that, which is the part that reads at
 * icon sizes and the part someone recognises on a home screen.
 *
 * It finds the ribbon rather than being told where it is. The first version of
 * this script carried a hand-measured crop box, which does not work: the "G" of
 * GEORGEL starts at x≈331 while the ribbon's tail runs out to x≈370, so no
 * rectangle contains one without the other. Painting the letters out took a
 * second rectangle, then a third, and each one clipped the ribbon somewhere
 * else.
 *
 * Instead: everything that is not background is grouped into connected shapes,
 * and the largest one is kept. The ribbon is a single large blob; each letter
 * is its own small one. That needs no coordinates, so it survives the logo
 * being replaced — which is the only reason to keep this as a script rather
 * than three committed PNGs with no history.
 *
 * Run: npm run icons
 */
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/**
 * How much of the icon the mark occupies.
 *
 * A maskable icon is cropped by the launcher to whatever shape it likes —
 * circle, squircle, rounded square — and only the central 80% is guaranteed to
 * survive. The spec's safe zone is a circle of 80% diameter, so the mark is
 * kept inside ~58% for the maskable variant and allowed to breathe at 72% for
 * the plain one.
 */
const FIT = { any: 0.72, maskable: 0.58 };

/**
 * White, matching the field the logo is drawn on. A maskable icon must fill its
 * whole square — a transparent or short background is what produces the black
 * corners you see on badly cut Android icons — so the background is painted
 * edge to edge regardless of where the mark lands.
 */
const BACKGROUND = '#ffffff';

/**
 * How far from white a pixel must be to count as part of a shape.
 *
 * The source is a JPEG, so the background is not a flat #ffffff and the edges
 * of the artwork carry ringing. Low enough to catch the navy wordmark, high
 * enough not to promote compression noise into shapes of its own — and stray
 * specks are harmless anyway, since only the largest shape is kept.
 */
const INK_THRESHOLD = 236;

/**
 * Runs in the page: isolates the largest shape and returns it, cropped to its
 * own bounds, drawn on the background colour at the requested size.
 */
function extractMark({ dataUri, size, fit, background, inkThreshold }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('the logo failed to decode'));
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const source = document.createElement('canvas');
      source.width = w;
      source.height = h;
      const sctx = source.getContext('2d', { willReadFrequently: true });
      sctx.drawImage(img, 0, 0);
      const pixels = sctx.getImageData(0, 0, w, h).data;

      const isInk = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = pixels[i * 4];
        const g = pixels[i * 4 + 1];
        const b = pixels[i * 4 + 2];
        isInk[i] = r < inkThreshold || g < inkThreshold || b < inkThreshold ? 1 : 0;
      }

      // Label connected shapes. Iterative flood fill with an explicit stack:
      // the ribbon is tens of thousands of pixels, which recursion would not
      // survive. 8-connectivity, so a shape joined only at a diagonal — which
      // anti-aliased artwork produces constantly — stays one shape.
      const label = new Int32Array(w * h).fill(-1);
      const sizes = [];
      const bounds = [];
      const stack = [];
      for (let start = 0; start < w * h; start++) {
        if (!isInk[start] || label[start] !== -1) continue;
        const id = sizes.length;
        sizes.push(0);
        const box = { minX: w, minY: h, maxX: -1, maxY: -1 };
        bounds.push(box);
        label[start] = id;
        stack.push(start);
        while (stack.length) {
          const p = stack.pop();
          const x = p % w;
          const y = (p / w) | 0;
          sizes[id]++;
          if (x < box.minX) box.minX = x;
          if (y < box.minY) box.minY = y;
          if (x > box.maxX) box.maxX = x;
          if (y > box.maxY) box.maxY = y;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              const q = ny * w + nx;
              if (isInk[q] && label[q] === -1) {
                label[q] = id;
                stack.push(q);
              }
            }
          }
        }
      }

      if (!sizes.length) {
        reject(new Error('the logo appears to be blank'));
        return;
      }
      let keep = 0;
      for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[keep]) keep = i;
      const box = bounds[keep];
      const markW = box.maxX - box.minX + 1;
      const markH = box.maxY - box.minY + 1;

      // Redraw the kept shape alone, at its own size, so the scale below is
      // computed from the ribbon's bounds rather than the source's margins.
      const cut = document.createElement('canvas');
      cut.width = markW;
      cut.height = markH;
      const cctx = cut.getContext('2d');
      const out = cctx.createImageData(markW, markH);
      for (let y = 0; y < markH; y++) {
        for (let x = 0; x < markW; x++) {
          const src = (y + box.minY) * w + (x + box.minX);
          const dst = (y * markW + x) * 4;
          const inShape = label[src] === keep;
          out.data[dst] = inShape ? pixels[src * 4] : 255;
          out.data[dst + 1] = inShape ? pixels[src * 4 + 1] : 255;
          out.data[dst + 2] = inShape ? pixels[src * 4 + 2] : 255;
          out.data[dst + 3] = 255;
        }
      }
      cctx.putImageData(out, 0, 0);

      const icon = document.createElement('canvas');
      icon.width = size;
      icon.height = size;
      const ictx = icon.getContext('2d');
      ictx.fillStyle = background;
      ictx.fillRect(0, 0, size, size);
      const scale = (size * fit) / Math.max(markW, markH);
      const drawW = markW * scale;
      const drawH = markH * scale;
      ictx.imageSmoothingQuality = 'high';
      ictx.drawImage(cut, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);

      resolve({
        dataUrl: icon.toDataURL('image/png'),
        shapes: sizes.length,
        markW,
        markH,
      });
    };
    img.src = dataUri;
  });
}

/**
 * Same fallback chain as verify-ui.mjs, plus an explicit override. A CI runner
 * has Playwright's own build; a developer machine usually has Chrome; a
 * prepared container may have a build whose revision does not match the pinned
 * Playwright, and then only an explicit path works.
 */
async function launch() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (executablePath) return chromium.launch({ executablePath });
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: 'chrome' });
  }
}

const logo = await readFile(join(publicDir, 'georgel-logo.png'));
// Named .png, actually a JPEG — see the note in README.md. The data URI has to
// declare what the bytes are, not what the filename claims.
const dataUri = `data:image/jpeg;base64,${logo.toString('base64')}`;

const targets = [
  { file: 'icon-192x192.png', size: 192, fit: FIT.any },
  { file: 'icon-512x512.png', size: 512, fit: FIT.any },
  { file: 'icon-maskable-512x512.png', size: 512, fit: FIT.maskable },
];

const browser = await launch();
try {
  const tab = await browser.newPage();
  await tab.setContent('<!doctype html><html><body></body></html>');
  for (const { file, size, fit } of targets) {
    const result = await tab.evaluate(extractMark, {
      dataUri,
      size,
      fit,
      background: BACKGROUND,
      inkThreshold: INK_THRESHOLD,
    });
    const png = Buffer.from(result.dataUrl.split(',')[1], 'base64');
    await writeFile(join(publicDir, file), png);
    console.log(
      `wrote ${file} — kept the largest of ${result.shapes} shapes ` +
        `(${result.markW}x${result.markH}), at ${Math.round(fit * 100)}% of ${size}px`,
    );
  }
} finally {
  await browser.close();
}
