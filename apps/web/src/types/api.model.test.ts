/**
 * That the shapes this client declares match the columns the API has.
 *
 * These types describe what comes back over the wire, and TypeScript checks
 * every read against them — which is exactly why a wrong one is invisible.
 * `Vitals` declared `createdAt`; VitalSign has `recordedAt` and no createdAt at
 * all. The compiler was satisfied, the vitals history table rendered
 * `new Date(undefined)`, and every row of a patient's clinical observations
 * showed "Invalid Date" in its date column.
 *
 * The related failure is a type that belongs to a different table entirely. The
 * research screen typed its list as the project-management `Project` while
 * reading `/research/projects`, so it read `projectName` (blank heading on
 * every row) and derived completion from `tasks` (0% on every row) while the
 * real `progress` column went unread. Again: no type error, because the type
 * was internally consistent — it was just about something else.
 *
 * So this compares the declared fields against the Prisma schema. Only the
 * types that map onto one model are listed; the rest are joins, aggregates or
 * request shapes, and asserting a mapping that does not exist would be worse
 * than asserting nothing.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA = join(HERE, '../../../api/prisma/schema.prisma');
const TYPES = join(HERE, 'api.ts');

/** Model name → its field names, from schema.prisma. */
function prismaModels(): Record<string, Set<string>> {
  const source = readFileSync(SCHEMA, 'utf8');
  const models: Record<string, Set<string>> = {};
  for (const m of source.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
    const fields = new Set<string>();
    for (const line of m[2].split('\n')) {
      const field = /^\s{2,}(\w+)\s+\S/.exec(line);
      if (field) fields.add(field[1]);
    }
    models[m[1]] = fields;
  }
  return models;
}

/** Interface name → its declared property names, from api.ts. */
function webTypes(): Record<string, string[]> {
  const source = readFileSync(TYPES, 'utf8');
  const types: Record<string, string[]> = {};
  for (const m of source.matchAll(
    /export interface (\w+)[^{]*\{([\s\S]*?)^\}/gm,
  )) {
    types[m[1]] = [
      ...new Set(
        [...m[2].matchAll(/^\s{2}(\w+)\??\s*:/gm)].map((f) => f[1]),
      ),
    ];
  }
  return types;
}

/**
 * The types that are one model's row, and the model they are.
 *
 * Deliberately partial. A type that merges several tables, or that describes a
 * computed response like ReportsSummary, has no single model to check against —
 * listing it with an ever-growing exception list would turn a real check into a
 * decorative one.
 */
const MAPPED: Record<string, string> = {
  Participant: 'Participant',
  Screening: 'Screening',
  Referral: 'Referral',
  FollowUp: 'FollowUp',
  PatientAssignment: 'PatientAssignment',
  ApprovalRequest: 'ApprovalRequest',
  FinanceTransaction: 'FinanceTransaction',
  InventoryItem: 'InventoryItem',
  StockMovement: 'StockMovement',
  Grant: 'Grant',
  GrantMilestone: 'GrantMilestone',
  Project: 'Project',
  ProjectTask: 'ProjectTask',
  Community: 'Community',
  OutreachEvent: 'Outreach',
  VolunteerProfile: 'VolunteerProfile',
  ResearchProject: 'ResearchProject',
  Vitals: 'VitalSign',
  AuditLogEntry: 'AuditLog',
};

/**
 * Names a service adds to a row on the way out, so they are legitimately on the
 * type and legitimately absent from the model.
 */
const COMPUTED = new Set([
  'user',
  // Prisma aggregate, included by ProjectsService — `_count: { select: { tasks } }`.
  '_count',
]);

describe('the API types match the schema', () => {
  const models = prismaModels();
  const types = webTypes();

  it('reads both files', () => {
    // Either parser returning nothing would make every case below vacuous.
    expect(Object.keys(models).length).toBeGreaterThan(30);
    expect(Object.keys(types).length).toBeGreaterThan(30);
  });

  it('maps only types that exist on both sides', () => {
    for (const [type, model] of Object.entries(MAPPED)) {
      expect(types[type], `no interface ${type}`).toBeTruthy();
      expect(models[model], `no model ${model}`).toBeTruthy();
    }
  });

  it('declares no field the model does not have', () => {
    const unknown: string[] = [];
    for (const [type, model] of Object.entries(MAPPED)) {
      for (const field of types[type] ?? []) {
        if (COMPUTED.has(field)) continue;
        if (!models[model].has(field)) unknown.push(`${type}.${field}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('has a Vitals type that names the column the row actually carries', () => {
    // The specific defect, kept by name: `createdAt` on a model whose timestamp
    // is `recordedAt` rendered "Invalid Date" on every row of a clinical
    // observation history.
    expect(types.Vitals).toContain('recordedAt');
    expect(types.Vitals).not.toContain('createdAt');
  });

  it('has a ResearchProject type distinct from Project', () => {
    // The research screen used `Project` for `/research/projects`, so it read
    // `projectName` and `tasks`, neither of which that table has.
    expect(types.ResearchProject).toContain('title');
    expect(types.ResearchProject).not.toContain('projectName');
    expect(types.ResearchProject).not.toContain('tasks');
  });
});
