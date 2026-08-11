/**
 * That the payloads this client sends are payloads the API declares.
 *
 * Four create paths on live screens were dead, and had been for as long as they
 * existed:
 *
 *   - POST /projects sent `title`; CreateProjectDto requires `projectName`.
 *   - POST /grants sent `title`; CreateGrantDto requires `grantName`.
 *   - POST /inventory sent string quantities and no `location`, which the DTO
 *     and the column both require.
 *   - POST /inventory (asset) sent the whole fixed-asset register — tag, serial,
 *     location, assignee, condition — nested under `assetDetails`, a key no DTO
 *     declares, so the validation whitelist dropped all of it.
 *
 * Every one of them returned 400 or silently discarded the fields, and every one
 * of them reported it with `console.error`. Nothing in CI could see them: the
 * API's own e2e specs send correct payloads, and the web tests do not send
 * payloads at all. The two halves were only ever checked against each other by
 * someone opening the screen and pressing the button.
 *
 * So this reads both sides. It is a cross-package read like roles.test.ts, and
 * for the same reason: the alternative is a generated client, and the cost of
 * that is higher than the cost of this.
 *
 * Two things are asserted, matching the two ways it went wrong:
 *   - a key sent and not declared is silently stripped;
 *   - a required key never sent is a guaranteed 400.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_SRC = join(HERE, '..');
const API_SRC = join(HERE, '../../../api/src');

function walk(dir: string, ext: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

/** The `{ ... }` starting at `start`, brace-matched. */
function block(source: string, start: number): string {
  let depth = 0;
  for (let j = start; j < source.length; j++) {
    if (source[j] === '{') depth++;
    else if (source[j] === '}') {
      depth--;
      if (depth === 0) return source.slice(start + 1, j);
    }
  }
  return source.slice(start + 1);
}

type Dto = { required: string[]; optional: string[] };

/** Every `export class X { ... }` in the API, as field lists. */
function readDtos(): Record<string, Dto> {
  const dtos: Record<string, Dto> = {};
  for (const file of walk(API_SRC, '.ts')) {
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(/export class (\w+)[^{]*\{/g)) {
      const body = block(source, m.index! + m[0].length - 1);
      const required: string[] = [];
      const optional: string[] = [];
      // A member is a run of decorators followed by `name?: type`. Decorators
      // may be on their own lines or crowded onto one, which is why this reads
      // the run rather than a single preceding line.
      for (const f of body.matchAll(
        /((?:@\w+\([\s\S]*?\)\s*|@\w+\s+)+)(\w+)(\?)?\s*[:!]/g,
      )) {
        (f[3] || /@IsOptional\b/.test(f[1]) ? optional : required).push(f[2]);
      }
      if (required.length || optional.length) {
        dtos[m[1]] = { required, optional };
      }
    }
  }
  return dtos;
}

/** Write routes, as `METHOD /path` → DTO class name. */
function readRoutes(): Record<string, string> {
  const routes: Record<string, string> = {};
  for (const file of walk(API_SRC, '.controller.ts')) {
    const source = readFileSync(file, 'utf8');
    const controller = /@Controller\('([^']*)'\)/.exec(source);
    if (!controller) continue;
    for (const m of source.matchAll(
      /@(Post|Put|Patch)\(\s*(?:'([^']*)')?\s*\)([\s\S]{0,1200}?)\)\s*\{/g,
    )) {
      const dto = /@Body\(\)\s*\w+\s*:\s*(\w+)/.exec(m[3]);
      if (!dto) continue;
      const path = '/' + [controller[1], m[2] || ''].filter(Boolean).join('/');
      routes[`${m[1].toUpperCase()} ${path}`] = dto[1];
    }
  }
  return routes;
}

/** A route pattern with `:params`, as a regex against a concrete path. */
function matches(pattern: string, path: string): boolean {
  const parts = pattern.split('/');
  const actual = path.split('/');
  if (parts.length !== actual.length) return false;
  return parts.every(
    (segment, i) => segment.startsWith(':') || segment === actual[i],
  );
}


/**
 * The keys of an object literal's top-level entries.
 *
 * Both spellings: `status: x` and the shorthand `status`. Reading only the
 * first form made the first draft of this check report a dozen handlers as
 * missing a required field they were in fact sending — which would have been a
 * check nobody could keep green, and therefore no check at all.
 */
function topLevelKeys(payload: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  let entry = '';
  const take = () => {
    const m = /^\s*(?:\/\/[^\n]*\n\s*)*(\w+)\s*(?::|$)/.exec(entry);
    if (m) keys.push(m[1]);
    entry = '';
  };
  for (const ch of payload) {
    if ('{(['.includes(ch)) depth++;
    else if ('})]'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) take();
    else entry += ch;
  }
  take();
  return [...new Set(keys)];
}

type Call = {
  file: string;
  verb: string;
  path: string;
  keys: string[];
};

/** Every `api.post|put|patch('/path', { ... })` in the web client. */
function readCalls(): Call[] {
  const calls: Call[] = [];
  for (const file of walk(WEB_SRC, '.tsx')) {
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(
      /api\.(post|put|patch)\(\s*[`'"]([^`'"]*)[`'"]\s*,\s*\{/g,
    )) {
      const payload = block(source, m.index! + m[0].length - 1);
      // A spread means the object is not fully described here; skip rather than
      // guess at what it carries.
      if (payload.includes('...')) continue;
      calls.push({
        file: file.slice(file.indexOf('/src/') + 1),
        verb: m[1].toUpperCase(),
        // `${id}` segments become a route parameter.
        path: m[2].replace(/\$\{[^}]*\}/g, ':param').split('?')[0],
        keys: topLevelKeys(payload),
      });
    }
  }
  return calls;
}

describe('the API contract', () => {
  it('can read both sides', () => {
    // If either parser silently finds nothing, every assertion below passes
    // vacuously — which is the way a check like this usually fails.
    expect(existsSync(API_SRC), `expected the API at ${API_SRC}`).toBe(true);
    expect(Object.keys(readRoutes()).length).toBeGreaterThan(50);
    expect(Object.keys(readDtos()).length).toBeGreaterThan(50);
    expect(readCalls().length).toBeGreaterThan(30);
  });

  const dtos = readDtos();
  const routes = readRoutes();
  const calls = readCalls();

  const resolve = (call: Call) => {
    const key = Object.keys(routes).find((r) => {
      const [verb, pattern] = r.split(' ');
      return verb === call.verb && matches(pattern, call.path);
    });
    return key ? dtos[routes[key]] : undefined;
  };

  it('sends no field the receiving DTO does not declare', () => {
    // `whitelist: true` strips these before the service sees them, which is
    // how a whole fixed-asset register went to the server and vanished.
    const stripped: string[] = [];
    for (const call of calls) {
      const dto = resolve(call);
      if (!dto) continue;
      const declared = new Set([...dto.required, ...dto.optional]);
      const extra = call.keys.filter((k) => !declared.has(k));
      if (extra.length) {
        stripped.push(`${call.file}: ${call.verb} ${call.path} -> ${extra}`);
      }
    }
    expect(stripped).toEqual([]);
  });

  it('sends every field the receiving DTO requires', () => {
    // A missing required field is a 400 on every single attempt, which is what
    // "Initiate new project", "Register Grant Award", "Add Item" and "Register
    // Asset" each did for their whole existence.
    const incomplete: string[] = [];
    for (const call of calls) {
      const dto = resolve(call);
      if (!dto) continue;
      const missing = dto.required.filter((k) => !call.keys.includes(k));
      if (missing.length) {
        incomplete.push(`${call.file}: ${call.verb} ${call.path} -> ${missing}`);
      }
    }
    expect(incomplete).toEqual([]);
  });
});
