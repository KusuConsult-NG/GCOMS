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
  {
    rules: {
      /**
       * Downgraded to a warning after reviewing all 33 occurrences.
       *
       * Twenty-two are `useEffect(() => { fetchX(); }, [dep])`, where fetchX
       * sets a loading flag before its first await. Eight synchronise component
       * state from a `?tab=` search param, which has to react to navigation and
       * so cannot be derived once during render. Three read something only
       * available after mount — the stored theme, the current date.
       *
       * All three are the ordinary way to do these things without a data
       * library, and the rule's own guidance is about avoiding cascading
       * renders rather than about correctness. Left visible as warnings rather
       * than silenced, so a genuinely new one still shows up.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);

export default eslintConfig;
