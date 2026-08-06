import {
  clientIp,
  loginAccountTracker,
  loginSourceTracker,
  parseTrustProxy,
  requestTracker,
} from './throttling';

const req = (over: Record<string, any> = {}) => ({
  ip: '10.0.0.1',
  headers: {},
  body: {},
  ...over,
});

describe('requestTracker', () => {
  // The bug this exists to prevent: behind a load balancer every request
  // resolves to the proxy address, so all users share one bucket.
  it('separates two authenticated users sharing one address', () => {
    const a = requestTracker(req({ headers: { authorization: 'Bearer aaa' } }));
    const b = requestTracker(req({ headers: { authorization: 'Bearer bbb' } }));
    expect(a).not.toBe(b);
  });

  it('keeps one user consistent across requests', () => {
    const h = { authorization: 'Bearer aaa' };
    expect(requestTracker(req({ headers: h }))).toBe(
      requestTracker(req({ headers: h, ip: '10.9.9.9' })),
    );
  });

  it('falls back to the address when unauthenticated', () => {
    expect(requestTracker(req())).toBe('ip:10.0.0.1');
  });

  it('does not leak the token into the key', () => {
    const key = requestTracker(
      req({ headers: { authorization: 'Bearer secret-token' } }),
    );
    expect(key).not.toContain('secret-token');
  });

  it('survives a missing ip and missing headers', () => {
    expect(() => requestTracker({} as never)).not.toThrow();
  });
});

describe('login trackers', () => {
  it('buckets per account regardless of source address', () => {
    const a = loginAccountTracker(
      req({ body: { email: 'A@Gcoms.org' }, ip: '1.1.1.1' }),
    );
    const b = loginAccountTracker(
      req({ body: { email: 'a@gcoms.org ' }, ip: '2.2.2.2' }),
    );
    expect(a).toBe(b);
  });

  // Guessing at one account must not lock everyone else out.
  it('does not collide across accounts', () => {
    expect(loginAccountTracker(req({ body: { email: 'a@x.org' } }))).not.toBe(
      loginAccountTracker(req({ body: { email: 'b@x.org' } })),
    );
  });

  it('handles a missing or non-string email', () => {
    expect(loginAccountTracker(req())).toBe('acct:<none>');
    expect(loginAccountTracker(req({ body: { email: { $ne: null } } }))).toBe(
      'acct:<none>',
    );
  });

  it('buckets per source independently of account', () => {
    expect(loginSourceTracker(req({ ip: '1.1.1.1' }))).not.toBe(
      loginSourceTracker(req({ ip: '2.2.2.2' })),
    );
  });
});

describe('parseTrustProxy', () => {
  // Unset must mean "do not trust": the permissive mistake removes rate
  // limiting entirely, the strict one only makes it stricter.
  it.each([undefined, '', '   ', 'false'])(
    'treats %p as not configured',
    (v) => {
      expect(parseTrustProxy(v)).toBeUndefined();
    },
  );

  it('accepts a hop count', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('0')).toBe(0);
  });

  it('accepts an explicit proxy list', () => {
    expect(parseTrustProxy('10.0.0.1, 10.0.0.2')).toEqual([
      '10.0.0.1',
      '10.0.0.2',
    ]);
  });

  it('accepts true, which the bootstrap warns about', () => {
    expect(parseTrustProxy('true')).toBe(true);
  });
});

describe('clientIp', () => {
  it('prefers req.ip', () => expect(clientIp(req())).toBe('10.0.0.1'));

  it('falls back to the socket address', () =>
    expect(clientIp({ socket: { remoteAddress: '5.5.5.5' } } as never)).toBe(
      '5.5.5.5',
    ));

  it('never returns undefined', () =>
    expect(clientIp({} as never)).toBe('unknown'));
});
