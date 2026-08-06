import { createHash, randomUUID } from 'crypto';
import { extname } from 'path';

/**
 * Upload rules.
 *
 * Documents here can carry patient and financial information, so files are never
 * served from a static directory. They are written outside the web root under a
 * generated name and streamed only through an authenticated endpoint.
 */

/** An allowlist, not a blocklist: a blocklist is a list of the attacks you thought of. */
export const ALLOWED_MIME: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
};

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * The stored name is generated, never derived from what the client sent. A
 * filename like "../../.env" cannot escape the directory if it is never used as
 * a path component in the first place.
 */
export function storedNameFor(originalName: string, mimeType: string): string {
  const allowed = ALLOWED_MIME[mimeType] ?? [];
  const ext = extname(originalName).toLowerCase();
  const safeExt = allowed.includes(ext) ? ext : (allowed[0] ?? '.bin');
  return `${randomUUID()}${safeExt}`;
}

/** The original name is kept for display only, stripped of anything path-like. */
export function displayName(originalName: string): string {
  const cleaned = originalName
    .replace(/[\\/]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 200);
  return cleaned || 'document';
}

export function isAllowed(mimeType: string, originalName: string): boolean {
  const exts = ALLOWED_MIME[mimeType];
  if (!exts) return false;
  const ext = extname(originalName).toLowerCase();
  // Both must agree, so an executable cannot ride in claiming to be a PDF.
  return exts.includes(ext);
}

export function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
