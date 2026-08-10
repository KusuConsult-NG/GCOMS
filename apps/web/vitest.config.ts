import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Unit tests for the browser code that is worth testing without a browser.
 *
 * verify-ui.mjs and verify-contrast.mjs drive the real application and catch
 * what only a real render can show. They are also slow, need both apps and a
 * seeded database running, and they exercise a screen rather than a rule. The
 * offline registration queue is a set of rules — an idempotency key that has to
 * survive a retry, a capture that must not be replayed under another account, a
 * record that must not be written in plaintext — and those want a test that
 * runs in a second and says which rule broke.
 *
 * jsdom rather than node, because the code under test is browser code: it uses
 * localStorage, IndexedDB and WebCrypto, and a version of it stubbed out to run
 * in node would no longer be the thing that ships.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
