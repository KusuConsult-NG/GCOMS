'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * The patient identity pass, with a QR code that is actually one.
 *
 * Both the field intake screen and the volunteer workspace rendered the same
 * block: a caption reading "Scan for Clinical Record" beside a decorative SVG
 * icon of a QR code — a fixed path, identical for every patient, encoding
 * nothing. Its own comment said so: "SIMULATED HIGH-RES DIGITAL QR CODE".
 *
 * A pass is what identifies someone at a follow-up visit, in a field clinic,
 * often on paper. Handing a patient a picture of a QR code and telling them it
 * can be scanned is a failure they only discover at the point of care, months
 * later, when the clinic cannot find their record.
 *
 * What it encodes is the registration id, which is the identifier the API
 * issues and the one every clinical record is keyed by. Deliberately not the
 * patient's name, date of birth or phone number: a pass is carried around and
 * left on tables, and a scanner should learn only which record to look up. The
 * id itself is not a credential — reading the record still requires a session
 * and passes the same PHI checks as any other access.
 *
 * Error correction is set to Q rather than the default M. These are printed on
 * a field printer, folded, and carried in a pocket; the extra redundancy is
 * what makes a creased or smudged pass still scan.
 */
export function PatientQrPass({
  registrationId,
  size = 128,
}: {
  registrationId: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(registrationId, {
      errorCorrectionLevel: 'Q',
      margin: 1,
      // Rendered at 4x the display size so a printed pass is not a scaled-up
      // 128px bitmap, which is the difference between "high-resolution" and a
      // claim of one.
      width: size * 4,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (live) setDataUrl(url);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [registrationId, size]);

  return (
    <div className="flex flex-col items-center justify-center rounded border border-[var(--secondary-container)] bg-white p-2">
      {dataUrl ? (
        /*
         * A plain <img>. next/image exists to optimise and serve remote or
         * bundled assets; this is a data: URI generated in the browser a
         * moment ago, and the static export sets images.unoptimized anyway —
         * so the component would add a loader around a string that is already
         * the final bytes.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`QR code encoding registration id ${registrationId}`}
          width={size}
          height={size}
          style={{ width: size, height: size, imageRendering: 'pixelated' }}
        />
      ) : (
        /* Never a placeholder that looks like a code. If it could not be
           generated, the pass says so and the id is still readable by eye. */
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center p-1 text-center text-[9px] font-semibold text-[var(--muted)]"
        >
          {failed ? 'QR code unavailable — use the ID below' : 'Generating…'}
        </div>
      )}
      <span className="mt-0.5 font-mono text-[8px] font-bold text-[var(--primary)]">
        {registrationId}
      </span>
    </div>
  );
}
