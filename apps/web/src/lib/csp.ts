/**
 * The Content-Security-Policy, in one place because it is now delivered two
 * different ways and the two must not drift apart.
 *
 * `proxy.ts` sets it as a response header with a per-request nonce. That is the
 * real policy and the one a production deployment should be running: a nonce is
 * what lets `script-src` refuse inline scripts outright, which is the directive
 * that stops an injected `<script>` from executing at all.
 *
 * The static export has no server, so there is no request to mint a nonce from
 * and no way to set a response header. It gets the policy as a `<meta
 * http-equiv>` tag instead, with `'unsafe-inline'` in `script-src` — Next
 * inlines its own hydration payload as `self.__next_f.push(...)` scripts whose
 * hashes cannot be known ahead of the build, so nonce-or-hash is not available
 * there. That is a genuine downgrade and it is the price of static hosting; the
 * rest of the policy (`connect-src`, `object-src`, `base-uri`, `form-action`)
 * is unaffected and still worth having.
 *
 * Two directives are silently dropped by browsers when they arrive in a meta
 * tag rather than a header — `frame-ancestors` and `sandbox` — so the meta
 * build omits `frame-ancestors` instead of implying a protection that is not
 * there. On a static host there is no way to send it. See README.md.
 */

export type CspOptions = {
  /**
   * Per-request nonce. Its absence is what selects the weaker inline policy,
   * so it is not optional by accident: the static export genuinely has none.
   */
  nonce?: string;
  isDev: boolean;
  /** Where the API lives — `connect-src` is what stops an injected script
   *  posting a JWT to anywhere else. */
  apiOrigin: string;
  /**
   * Built for a `<meta http-equiv>` rather than a header. Drops the directives
   * a meta tag cannot carry.
   */
  forMetaTag?: boolean;
};

export function buildCsp({
  nonce,
  isDev,
  apiOrigin,
  forMetaTag = false,
}: CspOptions): string {
  const scriptSrc = nonce
    ? // 'strict-dynamic' makes browsers that understand it ignore 'self' and the
      // host list, trusting only this nonce and whatever the nonced scripts load
      // themselves. 'self' stays for older browsers, which ignore strict-dynamic.
      `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}${isDev ? " 'unsafe-eval'" : ''}`,
    // Styles keep 'unsafe-inline'. A nonce does not cover inline style
    // *attributes*, and React writes those for every `style={{ ... }}` in the
    // tree, so nonce-only style-src would drop styling rather than tighten it.
    // The XSS value here is small next to script-src: the injection has to run
    // before it can write a style attribute.
    //
    // What it no longer carries is fonts.googleapis.com. Inter is self-hosted
    // by next/font now, so neither the stylesheet origin here nor
    // fonts.gstatic.com below has to be trusted at all.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${apiOrigin}${isDev ? ' ws: http://localhost:*' : ''}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Ignored in a meta tag, so it is not claimed there.
    ...(forMetaTag ? [] : ["frame-ancestors 'none'"]),
    // Only when the API is already HTTPS. Otherwise this silently rewrites an
    // http:// API origin to https:// and every request fails — which is exactly
    // what happens if someone runs `next start` against a local API.
    ...(!isDev && apiOrigin.startsWith('https://')
      ? ['upgrade-insecure-requests']
      : []),
  ].join('; ');
}
