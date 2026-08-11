import { readFileSync, readlinkSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * The Dockerfile runs `npm prune --omit=dev`, so the image that reaches a
 * server has runtime dependencies only. Every command the deployment then runs
 * — the release-step migration, the bootstrap, the server itself — executes
 * inside that pruned image.
 *
 * `prisma` was a devDependency. `npm run db:migrate` is `prisma migrate deploy`.
 * The image therefore could not run the migration that the Dockerfile's own
 * comment, the README, docker-compose's `migrate` service and every hosted
 * deploy depend on: `prisma: not found`, before it opened a connection. CI only
 * ever built the image, so nothing exercised it.
 *
 * This asserts the property directly rather than trusting the dependency block
 * to stay sorted correctly: for each script the deployment runs, the binary it
 * invokes must be owned by a package that survives the prune.
 */

// Resolved from this file, not process.cwd(), so it holds wherever jest is run.
const apiRoot = join(__dirname, '..', '..');

interface PackageJson {
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

const pkg = JSON.parse(
  readFileSync(join(apiRoot, 'package.json'), 'utf8'),
) as PackageJson;

const dockerfile = readFileSync(join(apiRoot, 'Dockerfile'), 'utf8');

/**
 * Scripts that run inside the built image. Adding one here is the point: it
 * declares "the deployment calls this", and the test then holds the image to it.
 */
const PRODUCTION_SCRIPTS = ['start:prod', 'db:migrate', 'db:bootstrap'];

/** Provided by the Node runtime, so nothing needs to ship them. */
const BUILT_IN = new Set(['node', 'npm', 'npx']);

/**
 * `node_modules/.bin/x` is a symlink into the package that owns it —
 * `../prisma/build/index.js`, or `../@nestjs/cli/bin/nest.js` when scoped. The
 * first segment (two, for a scope) is the package name.
 */
function ownerOfBinary(binary: string): string | null {
  const link = join(apiRoot, 'node_modules', '.bin', binary);
  if (!existsSync(link)) return null;
  const segments = readlinkSync(link)
    .split('/')
    .filter((s) => s !== '..');
  return segments[0]?.startsWith('@')
    ? `${segments[0]}/${segments[1]}`
    : (segments[0] ?? null);
}

describe('the production image', () => {
  it('prunes dev dependencies, which is what makes the rest of this matter', () => {
    // If this stops being true the test above it is vacuous rather than wrong,
    // and a vacuous test is worse than none.
    expect(dockerfile).toMatch(/npm prune --omit=dev/);
  });

  it('copies the built output, node_modules and the prisma directory into the runtime stage', () => {
    // `prisma migrate deploy` reads schema.prisma and the migrations folder. The
    // CLI being present is no use if its input was left in the build stage.
    for (const path of ['/app/node_modules', '/app/dist', '/app/prisma']) {
      expect(dockerfile).toContain(path);
    }
  });

  describe('railway.json', () => {
    interface RailwayConfig {
      build: { builder: string; dockerfilePath: string };
      deploy: {
        preDeployCommand: string[];
        startCommand: string;
        healthcheckPath: string;
      };
    }

    const railway = JSON.parse(
      readFileSync(join(apiRoot, 'railway.json'), 'utf8'),
    ) as RailwayConfig;

    it('builds the Dockerfile that is actually here', () => {
      expect(railway.build.builder).toBe('DOCKERFILE');
      expect(existsSync(join(apiRoot, railway.build.dockerfilePath))).toBe(
        true,
      );
    });

    it('starts the same process the Dockerfile does', () => {
      // Drifting apart means the platform runs something the image was never
      // tested with, and `docker compose up` stops being evidence of anything.
      const cmd = /CMD \["node", "(.+?)"\]/.exec(dockerfile);
      expect(cmd).not.toBeNull();
      expect(railway.deploy.startCommand).toBe(`node ${cmd![1]}`);
    });

    it('runs migrations before the new release takes traffic', () => {
      expect(railway.deploy.preDeployCommand).toContain('npm run db:migrate');
    });

    it('only names npm scripts that exist', () => {
      for (const command of railway.deploy.preDeployCommand) {
        const script = /^npm run ([\w:-]+)$/.exec(command);
        expect(script).not.toBeNull();
        expect(pkg.scripts[script![1]]).toBeDefined();
      }
    });

    it('health-checks a route the API actually serves', () => {
      // A healthcheck on a path that 404s fails every deploy, and the failure
      // reads as "the app is broken" rather than "the path is wrong".
      const controller = readFileSync(
        join(apiRoot, 'src', 'health', 'health.controller.ts'),
        'utf8',
      );
      const base = /@Controller\('([^']+)'\)/.exec(controller)?.[1];
      const routes = [...controller.matchAll(/@Get\((?:'([^']*)')?\)/g)].map(
        (m) => `/${base}${m[1] ? `/${m[1]}` : ''}`,
      );
      expect(routes).toContain(railway.deploy.healthcheckPath);
    });
  });

  describe.each(PRODUCTION_SCRIPTS)('npm run %s', (script) => {
    it('is defined', () => {
      expect(pkg.scripts[script]).toBeDefined();
    });

    it('invokes a binary that survives the prune', () => {
      const command = pkg.scripts[script];
      const binary = command.trim().split(/\s+/)[0];

      if (BUILT_IN.has(binary)) return;

      const owner = ownerOfBinary(binary);
      expect(owner).not.toBeNull();

      const inRuntimeDeps = owner !== null && owner in pkg.dependencies;
      const inDevDeps = owner !== null && owner in pkg.devDependencies;

      // Named rather than a bare boolean so a failure says which package to move.
      expect({ binary, owner, inRuntimeDeps, inDevDeps }).toEqual({
        binary,
        owner,
        inRuntimeDeps: true,
        inDevDeps: false,
      });
    });
  });
});
