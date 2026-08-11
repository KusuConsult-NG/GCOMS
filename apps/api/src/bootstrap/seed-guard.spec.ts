import { assertSafeToSeed, PRODUCTION_SEED_OVERRIDE } from './seed-guard';

/**
 * The bug this covers: two guards ran in sequence, one accepting
 * 'yes-i-mean-it' and one accepting 'true', so every value was rejected by one
 * of them. The seed was documented as having an override and had none.
 *
 * So the test that matters is not "it refuses in production" — that half always
 * worked — but "the documented value is actually accepted".
 */
describe('assertSafeToSeed', () => {
  const noop = () => undefined;

  it('permits seeding when NODE_ENV is not production', () => {
    expect(() => assertSafeToSeed({}, noop)).not.toThrow();
    expect(() =>
      assertSafeToSeed({ NODE_ENV: 'development' }, noop),
    ).not.toThrow();
    expect(() => assertSafeToSeed({ NODE_ENV: 'test' }, noop)).not.toThrow();
  });

  it('refuses in production with no override', () => {
    expect(() => assertSafeToSeed({ NODE_ENV: 'production' }, noop)).toThrow(
      /Refusing to seed/,
    );
  });

  it('accepts the override value it documents', () => {
    expect(() =>
      assertSafeToSeed(
        {
          NODE_ENV: 'production',
          ALLOW_PRODUCTION_SEED: PRODUCTION_SEED_OVERRIDE,
        },
        noop,
      ),
    ).not.toThrow();
  });

  it('names an override value that the guard itself accepts', () => {
    // The regression, stated directly: take the value out of the error message
    // and feed it back in. Under the old pair of guards this failed, because
    // the message named 'yes-i-mean-it' and the second guard wanted 'true'.
    let message = '';
    try {
      assertSafeToSeed({ NODE_ENV: 'production' }, noop);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    const quoted = /ALLOW_PRODUCTION_SEED=(\S+?)\.?$/m.exec(message);
    expect(quoted).not.toBeNull();

    const advertised = quoted![1];
    expect(() =>
      assertSafeToSeed(
        { NODE_ENV: 'production', ALLOW_PRODUCTION_SEED: advertised },
        noop,
      ),
    ).not.toThrow();
  });

  it('rejects a value that is merely truthy', () => {
    for (const value of ['true', '1', 'yes', 'YES-I-MEAN-IT']) {
      expect(() =>
        assertSafeToSeed(
          { NODE_ENV: 'production', ALLOW_PRODUCTION_SEED: value },
          noop,
        ),
      ).toThrow(/Refusing to seed/);
    }
  });

  it('warns loudly when it does let a production seed through', () => {
    const warnings: string[] = [];
    assertSafeToSeed(
      {
        NODE_ENV: 'production',
        ALLOW_PRODUCTION_SEED: PRODUCTION_SEED_OVERRIDE,
      },
      (m) => warnings.push(m),
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/share one password/);
  });

  it('points at the bootstrap command as the way to stand up a deployment', () => {
    // Refusing without naming the alternative is how somebody ends up setting
    // the override on a live database because it was the only path offered.
    expect(() => assertSafeToSeed({ NODE_ENV: 'production' }, noop)).toThrow(
      /db:bootstrap/,
    );
  });
});
