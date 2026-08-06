import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from './csv';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
import {
  FINANCE_READ_ROLES,
  GRANT_READ_ROLES,
  HR_READ_ROLES,
  INVENTORY_READ_ROLES,
  PHI_READ_ROLES,
  PROCUREMENT_READ_ROLES,
  PROJECT_READ_ROLES,
  Role,
} from '../auth/roles.constants';

type Dataset = {
  label: string;
  roles: Role[];
  /** Patient data is additionally narrowed to the caller's caseload. */
  phiScoped?: boolean;
  columns: string[];
  load: (
    actor: PhiActor,
    opts: { status?: string },
  ) => Promise<Record<string, unknown>[]>;
};

@Injectable()
export class ExportsService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  private datasets(): Record<string, Dataset> {
    return {
      participants: {
        label: 'Patients',
        roles: PHI_READ_ROLES,
        phiScoped: true,
        columns: [
          'registrationId',
          'nationalId',
          'firstName',
          'lastName',
          'gender',
          'dateOfBirth',
          'phoneNumber',
          'lga',
          'ward',
          'address',
          'consentGiven',
          'createdAt',
        ],
        load: async (actor) =>
          this.prisma.participant.findMany({
            where: { ...this.phi.participantScope(actor) },
            orderBy: { createdAt: 'desc' },
          }),
      },
      screenings: {
        label: 'Screenings',
        roles: PHI_READ_ROLES,
        phiScoped: true,
        columns: [
          'createdAt',
          'cancerType',
          'result',
          'riskScore',
          'participant',
          'conductedBy',
        ],
        load: async (actor) => {
          const scope = this.phi.participantScope(actor);
          const rows = await this.prisma.screening.findMany({
            where: scope ? { participant: scope } : {},
            orderBy: { createdAt: 'desc' },
            include: {
              participant: {
                select: {
                  registrationId: true,
                  firstName: true,
                  lastName: true,
                },
              },
              conductedBy: { select: { firstName: true, lastName: true } },
            },
          });
          return rows.map((r) => ({
            createdAt: r.createdAt,
            cancerType: r.cancerType,
            result: r.result,
            riskScore: r.riskScore,
            participant: `${r.participant.registrationId} ${r.participant.firstName} ${r.participant.lastName}`,
            conductedBy: `${r.conductedBy.firstName} ${r.conductedBy.lastName}`,
          }));
        },
      },
      finance: {
        label: 'Finance transactions',
        roles: FINANCE_READ_ROLES,
        columns: [
          'createdAt',
          'type',
          'category',
          'description',
          'amount',
          'status',
          'requestedBy',
        ],
        load: async (_a, { status }) => {
          const rows = await this.prisma.financeTransaction.findMany({
            where: status ? { status } : {},
            orderBy: { createdAt: 'desc' },
            include: {
              requestedBy: { select: { firstName: true, lastName: true } },
            },
          });
          return rows.map((r) => ({
            createdAt: r.createdAt,
            type: r.type,
            category: r.category,
            description: r.description,
            amount: r.amount,
            status: r.status,
            requestedBy: `${r.requestedBy.firstName} ${r.requestedBy.lastName}`,
          }));
        },
      },
      procurement: {
        label: 'Procurement orders',
        roles: PROCUREMENT_READ_ROLES,
        columns: [
          'createdAt',
          'itemName',
          'quantity',
          'estimatedCost',
          'vendor',
          'status',
        ],
        load: async (_a, { status }) =>
          this.prisma.procurementOrder.findMany({
            where: status ? { status } : {},
            orderBy: { createdAt: 'desc' },
          }),
      },
      inventory: {
        label: 'Inventory',
        roles: INVENTORY_READ_ROLES,
        columns: [
          'itemName',
          'category',
          'quantity',
          'unit',
          'location',
          'status',
        ],
        load: async () =>
          this.prisma.inventoryItem.findMany({ orderBy: { itemName: 'asc' } }),
      },
      'stock-movements': {
        label: 'Stock movements',
        roles: INVENTORY_READ_ROLES,
        columns: [
          'movementDate',
          'item',
          'type',
          'quantity',
          'fromLocation',
          'toLocation',
          'reference',
          'authorisedBy',
        ],
        load: async () => {
          const rows = await this.prisma.stockMovement.findMany({
            orderBy: { movementDate: 'desc' },
            include: { inventoryItem: { select: { itemName: true } } },
          });
          return rows.map((r) => ({
            movementDate: r.movementDate,
            item: r.inventoryItem.itemName,
            type: r.type,
            quantity: r.quantity,
            fromLocation: r.fromLocation,
            toLocation: r.toLocation,
            reference: r.reference,
            authorisedBy: r.authorisedBy,
          }));
        },
      },
      grants: {
        label: 'Grants',
        roles: GRANT_READ_ROLES,
        columns: [
          'grantName',
          'donorName',
          'amount',
          'startDate',
          'endDate',
          'status',
        ],
        load: async () =>
          this.prisma.grant.findMany({ orderBy: { createdAt: 'desc' } }),
      },
      'grant-milestones': {
        label: 'Grant milestones',
        roles: GRANT_READ_ROLES,
        columns: ['grant', 'title', 'metric', 'dueDate', 'progress', 'status'],
        load: async () => {
          const rows = await this.prisma.grantMilestone.findMany({
            orderBy: { dueDate: 'asc' },
            include: { grant: { select: { grantName: true } } },
          });
          return rows.map((r) => ({
            grant: r.grant.grantName,
            title: r.title,
            metric: r.metric,
            dueDate: r.dueDate,
            progress: r.progress,
            status: r.status,
          }));
        },
      },
      projects: {
        label: 'Projects',
        roles: PROJECT_READ_ROLES,
        columns: [
          'projectName',
          'description',
          'budget',
          'startDate',
          'endDate',
          'status',
        ],
        load: async () =>
          this.prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
      },
      staff: {
        label: 'Staff directory',
        roles: HR_READ_ROLES,
        columns: [
          'firstName',
          'lastName',
          'email',
          'role',
          'isActive',
          'createdAt',
        ],
        load: async () =>
          this.prisma.user.findMany({
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
      },
    };
  }

  /** What this caller may export — drives the UI's download menu. */
  availableFor() {
    return Object.entries(this.datasets()).map(([key, d]) => ({
      key,
      label: d.label,
      roles: d.roles,
    }));
  }

  async build(
    key: string,
    actor: PhiActor,
    opts: { status?: string },
  ): Promise<string> {
    const dataset = this.datasets()[key];
    if (!dataset) throw new NotFoundException(`Unknown export: ${key}`);

    // Checked here, not by a route decorator: an export is a bulk read of a
    // module's data and must obey that module's permissions.
    if (!dataset.roles.includes(actor.role as Role)) {
      throw new ForbiddenException(
        `Your role cannot export ${dataset.label.toLowerCase()}`,
      );
    }

    const rows = await dataset.load(actor, opts);
    return toCsv(rows, dataset.columns);
  }
}
