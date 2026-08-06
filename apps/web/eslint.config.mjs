import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next, but anchored with `**/` rather
    // than at the project root. `.next/**` only matches a build directory
    // sitting exactly at apps/web/.next; it does not match one nested any
    // deeper. A stray `src/.next` therefore got linted, and its generated
    // route validators contributed 1158 of the 1364 errors eslint reported
    // here — enough noise to hide the 206 real ones completely.
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
  ]),
]);

export default eslintConfig;
