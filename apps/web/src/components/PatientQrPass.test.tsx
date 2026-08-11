/**
 * That the identity pass carries a QR code, and that it encodes the patient.
 *
 * It used to be a decorative SVG icon: one fixed path, identical on every
 * patient's pass, encoding nothing, captioned "Scan for Clinical Record" and
 * offered with a Print button. A pass is what identifies someone at a follow-up
 * visit in a field clinic, often on paper, so the failure only surfaces months
 * later at the point of care — the clinic scans it and gets nothing.
 *
 * The decode below is the case that matters: rendering *a* QR code is not the
 * claim, encoding *this patient's registration id* is.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { PatientQrPass } from './PatientQrPass';

/** Reads the code back out of the rendered data: URI. */
function decode(dataUrl: string): string | null {
  expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  const png = PNG.sync.read(
    Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64'),
  );
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null;
}

// vitest's globals are off here, so testing-library's automatic teardown never
// runs and each render would stack another pass in the document.
afterEach(cleanup);

const rendered = async () => {
  const img = await waitFor(() => screen.getByRole('img'));
  return img.getAttribute('src') as string;
};

describe('PatientQrPass', () => {
  it('encodes the registration id', async () => {
    render(<PatientQrPass registrationId="GC-2026-000123" />);
    expect(decode(await rendered())).toBe('GC-2026-000123');
  });

  it('encodes a different id for a different patient', async () => {
    // The whole defect, stated as a test: the old pass was the same image for
    // everyone, so this is the assertion it would have failed.
    const { unmount } = render(<PatientQrPass registrationId="GC-2026-000123" />);
    const first = await rendered();
    unmount();

    render(<PatientQrPass registrationId="GC-2026-000999" />);
    const second = await rendered();

    expect(second).not.toBe(first);
    expect(decode(second)).toBe('GC-2026-000999');
  });

  it('encodes the id and nothing else about the patient', async () => {
    // A pass is carried around and left on tables. A scanner should learn which
    // record to look up, not the patient's name or date of birth.
    render(<PatientQrPass registrationId="GC-2026-000123" />);
    expect(decode(await rendered())).toBe('GC-2026-000123');
  });

  it('prints the id in text beside the code', async () => {
    // So a pass whose code will not scan — creased, faded, a broken camera —
    // is still usable by reading it out.
    render(<PatientQrPass registrationId="GC-2026-000123" />);
    await waitFor(() => screen.getByRole('img'));
    expect(screen.getByText('GC-2026-000123')).toBeTruthy();
  });

  it('describes itself for a screen reader', async () => {
    render(<PatientQrPass registrationId="GC-2026-000123" />);
    const img = await waitFor(() => screen.getByRole('img'));
    expect(img.getAttribute('alt')).toContain('GC-2026-000123');
  });
});
