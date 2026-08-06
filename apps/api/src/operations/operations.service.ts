import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as dto from './dto/operations.dto';
import {
  createWithReference,
  referencePrefix,
} from '../common/reference-sequence';

/** likelihood x impact, so a risk score can never contradict its own inputs. */
const LEVEL: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const riskScore = (likelihood: string, impact: string) =>
  (LEVEL[likelihood] ?? 2) * (LEVEL[impact] ?? 2);

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  private mustExist<T>(row: T | null, label: string): T {
    if (!row) throw new NotFoundException(`${label} not found`);
    return row;
  }

  // ---------------- Recruitment ----------------
  listJobOpenings(status?: string) {
    return this.prisma.jobOpening.findMany({
      where: status ? { status } : {},
      orderBy: { deadline: 'asc' },
      include: { applicants: true },
    });
  }

  createJobOpening(d: dto.CreateJobOpeningDto) {
    return this.prisma.jobOpening.create({
      data: {
        title: d.title.trim(),
        department: d.department.trim(),
        employmentType: d.employmentType ?? 'FULL_TIME',
        location: d.location.trim(),
        deadline: new Date(d.deadline),
        description: d.description?.trim() || null,
        status: d.status ?? 'OPEN',
      },
      include: { applicants: true },
    });
  }

  async updateJobOpening(id: string, d: dto.UpdateJobOpeningDto) {
    this.mustExist(
      await this.prisma.jobOpening.findUnique({ where: { id } }),
      'Job opening',
    );
    const data: Prisma.JobOpeningUpdateInput = {};
    if (d.title !== undefined) data.title = d.title.trim();
    if (d.department !== undefined) data.department = d.department.trim();
    if (d.employmentType !== undefined) data.employmentType = d.employmentType;
    if (d.location !== undefined) data.location = d.location.trim();
    if (d.deadline !== undefined) data.deadline = new Date(d.deadline);
    if (d.description !== undefined)
      data.description = d.description.trim() || null;
    if (d.status !== undefined) data.status = d.status;
    return this.prisma.jobOpening.update({
      where: { id },
      data,
      include: { applicants: true },
    });
  }

  async createApplicant(d: dto.CreateApplicantDto) {
    this.mustExist(
      await this.prisma.jobOpening.findUnique({
        where: { id: d.jobOpeningId },
      }),
      'Job opening',
    );
    return this.prisma.jobApplicant.create({
      data: {
        jobOpeningId: d.jobOpeningId,
        name: d.name.trim(),
        email: d.email?.trim() || null,
        phone: d.phone?.trim() || null,
        stage: d.stage ?? 'APPLIED',
        notes: d.notes?.trim() || null,
      },
    });
  }

  async updateApplicant(id: string, d: dto.UpdateApplicantDto) {
    this.mustExist(
      await this.prisma.jobApplicant.findUnique({ where: { id } }),
      'Applicant',
    );
    const data: Prisma.JobApplicantUpdateInput = {};
    if (d.stage !== undefined) data.stage = d.stage;
    if (d.notes !== undefined) data.notes = d.notes.trim() || null;
    return this.prisma.jobApplicant.update({ where: { id }, data });
  }

  // ---------------- Training ----------------
  listTraining() {
    return this.prisma.trainingRecord.findMany({
      orderBy: { trainingDate: 'desc' },
    });
  }

  createTraining(d: dto.CreateTrainingDto) {
    const expiry = d.expiryDate ? new Date(d.expiryDate) : null;
    return this.prisma.trainingRecord.create({
      data: {
        staffId: d.staffId ?? null,
        staffName: d.staffName.trim(),
        title: d.title.trim(),
        provider: d.provider?.trim() || null,
        type: d.type ?? 'CLINICAL_SKILLS',
        trainingDate: new Date(d.trainingDate),
        certified: d.certified ?? false,
        expiryDate: expiry,
        // Derived, so a certificate cannot show ACTIVE past its expiry.
        status: expiry && expiry < new Date() ? 'EXPIRED' : 'ACTIVE',
      },
    });
  }

  // ---------------- Volunteers ----------------
  listVolunteers() {
    return this.prisma.volunteerProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async createVolunteerProfile(d: dto.CreateVolunteerProfileDto) {
    this.mustExist(
      await this.prisma.user.findUnique({ where: { id: d.userId } }),
      'User',
    );
    const clash = await this.prisma.volunteerProfile.findUnique({
      where: { userId: d.userId },
    });
    if (clash)
      throw new ConflictException('That user already has a volunteer profile');
    return this.prisma.volunteerProfile.create({
      data: {
        userId: d.userId,
        lga: d.lga.trim(),
        ward: d.ward?.trim() || null,
        address: d.address?.trim() || null,
        stipend: d.stipend ?? 0,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  // ---------------- Governance ----------------
  listBoardMembers() {
    return this.prisma.boardMember.findMany({ orderBy: { role: 'asc' } });
  }

  createBoardMember(d: dto.CreateBoardMemberDto) {
    if (new Date(d.termEnd) < new Date(d.termStart)) {
      throw new BadRequestException('termEnd cannot be before termStart');
    }
    return this.prisma.boardMember.create({
      data: {
        name: d.name.trim(),
        title: d.title?.trim() || null,
        role: d.role ?? 'MEMBER',
        committees: d.committees?.trim() || null,
        phone: d.phone?.trim() || null,
        email: d.email?.trim() || null,
        termStart: new Date(d.termStart),
        termEnd: new Date(d.termEnd),
      },
    });
  }

  listBoardActions(status?: string) {
    return this.prisma.boardAction.findMany({
      where: status ? { status } : {},
      orderBy: { dueDate: 'asc' },
      include: { meeting: { select: { id: true, title: true } } },
    });
  }

  createBoardAction(d: dto.CreateBoardActionDto) {
    return this.prisma.boardAction.create({
      data: {
        description: d.description.trim(),
        responsible: d.responsible.trim(),
        dueDate: new Date(d.dueDate),
        priority: d.priority ?? 'MEDIUM',
        meetingId: d.meetingId ?? null,
      },
      include: { meeting: { select: { id: true, title: true } } },
    });
  }

  async updateBoardAction(id: string, d: dto.UpdateBoardActionDto) {
    this.mustExist(
      await this.prisma.boardAction.findUnique({ where: { id } }),
      'Action',
    );
    const data: Prisma.BoardActionUpdateInput = {};
    if (d.status !== undefined) data.status = d.status;
    if (d.priority !== undefined) data.priority = d.priority;
    if (d.dueDate !== undefined) data.dueDate = new Date(d.dueDate);
    if (d.responsible !== undefined) data.responsible = d.responsible.trim();
    return this.prisma.boardAction.update({ where: { id }, data });
  }

  // ---------------- Stock movements ----------------
  listMovements(inventoryItemId?: string) {
    return this.prisma.stockMovement.findMany({
      where: inventoryItemId ? { inventoryItemId } : {},
      orderBy: { movementDate: 'desc' },
      include: {
        inventoryItem: { select: { id: true, itemName: true, unit: true } },
      },
    });
  }

  /**
   * Records the movement and applies it to the item's quantity in one
   * transaction — a stock ledger that does not move stock is decoration.
   */
  async createMovement(d: dto.CreateStockMovementDto) {
    const item = this.mustExist(
      await this.prisma.inventoryItem.findUnique({
        where: { id: d.inventoryItemId },
      }),
      'Inventory item',
    );

    const outward = ['STOCK_ISSUE', 'DISPOSAL'].includes(d.type);
    const delta =
      d.type === 'TRANSFER' ? 0 : outward ? -d.quantity : d.quantity;
    if (item.quantity + delta < 0) {
      throw new BadRequestException(
        `Cannot issue ${d.quantity}: only ${item.quantity} in stock`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          inventoryItemId: d.inventoryItemId,
          type: d.type,
          quantity: d.quantity,
          fromLocation: d.fromLocation?.trim() || null,
          toLocation: d.toLocation?.trim() || null,
          reference: d.reference?.trim() || null,
          authorisedBy: d.authorisedBy?.trim() || null,
          movementDate: d.movementDate ? new Date(d.movementDate) : new Date(),
          remarks: d.remarks?.trim() || null,
        },
        include: { inventoryItem: { select: { id: true, itemName: true } } },
      });

      if (delta !== 0) {
        const quantity = item.quantity + delta;
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity,
            status:
              quantity === 0
                ? 'OUT_OF_STOCK'
                : quantity <= 20
                  ? 'LOW_STOCK'
                  : 'IN_STOCK',
          },
        });
      }
      return movement;
    });
  }

  // ---------------- Project risks ----------------
  listRisks(projectId?: string) {
    return this.prisma.projectRisk.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { score: 'desc' },
      include: { project: { select: { id: true, projectName: true } } },
    });
  }

  async createRisk(d: dto.CreateProjectRiskDto) {
    this.mustExist(
      await this.prisma.project.findUnique({ where: { id: d.projectId } }),
      'Project',
    );
    const likelihood = d.likelihood ?? 'MEDIUM';
    const impact = d.impact ?? 'MEDIUM';
    return this.prisma.projectRisk.create({
      data: {
        projectId: d.projectId,
        title: d.title.trim(),
        category: d.category?.trim() || 'OPERATIONAL',
        likelihood,
        impact,
        score: riskScore(likelihood, impact),
        mitigation: d.mitigation?.trim() || null,
        owner: d.owner?.trim() || null,
      },
      include: { project: { select: { id: true, projectName: true } } },
    });
  }

  async updateRisk(id: string, d: dto.UpdateProjectRiskDto) {
    const existing = this.mustExist(
      await this.prisma.projectRisk.findUnique({ where: { id } }),
      'Risk',
    );
    const likelihood = d.likelihood ?? existing.likelihood;
    const impact = d.impact ?? existing.impact;
    return this.prisma.projectRisk.update({
      where: { id },
      data: {
        likelihood,
        impact,
        score: riskScore(likelihood, impact),
        status: d.status ?? existing.status,
        mitigation:
          d.mitigation !== undefined
            ? d.mitigation.trim() || null
            : existing.mitigation,
        owner: d.owner !== undefined ? d.owner.trim() || null : existing.owner,
      },
      include: { project: { select: { id: true, projectName: true } } },
    });
  }

  // ---------------- Donors & grant reporting ----------------
  listDonors() {
    return this.prisma.donor.findMany({ orderBy: { organisation: 'asc' } });
  }

  async createDonor(d: dto.CreateDonorDto) {
    const clash = await this.prisma.donor.findUnique({
      where: { organisation: d.organisation.trim() },
    });
    if (clash)
      throw new ConflictException('That donor organisation already exists');
    return this.prisma.donor.create({
      data: {
        organisation: d.organisation.trim(),
        country: d.country?.trim() || null,
        type: d.type ?? 'MULTILATERAL',
        contactName: d.contactName?.trim() || null,
        contactTitle: d.contactTitle?.trim() || null,
        email: d.email?.trim() || null,
        phone: d.phone?.trim() || null,
        interests: d.interests?.trim() || null,
        lastContact: d.lastContact ? new Date(d.lastContact) : null,
        notes: d.notes?.trim() || null,
      },
    });
  }

  listReportSchedules(grantId?: string) {
    return this.prisma.grantReportSchedule.findMany({
      where: grantId ? { grantId } : {},
      orderBy: { dueDate: 'asc' },
      include: {
        grant: { select: { id: true, grantName: true, donorName: true } },
      },
    });
  }

  async createReportSchedule(d: dto.CreateReportScheduleDto) {
    this.mustExist(
      await this.prisma.grant.findUnique({ where: { id: d.grantId } }),
      'Grant',
    );
    const due = new Date(d.dueDate);
    return this.prisma.grantReportSchedule.create({
      data: {
        grantId: d.grantId,
        title: d.title.trim(),
        type: d.type ?? 'QUARTERLY',
        dueDate: due,
        officer: d.officer?.trim() || null,
        status: due < new Date() ? 'LATE' : 'UPCOMING',
      },
      include: { grant: { select: { id: true, grantName: true } } },
    });
  }

  async updateReportSchedule(id: string, d: dto.UpdateReportScheduleDto) {
    this.mustExist(
      await this.prisma.grantReportSchedule.findUnique({ where: { id } }),
      'Report schedule',
    );
    const data: Prisma.GrantReportScheduleUpdateInput = {};
    if (d.dueDate !== undefined) data.dueDate = new Date(d.dueDate);
    if (d.officer !== undefined) data.officer = d.officer.trim() || null;
    if (d.reference !== undefined) data.reference = d.reference.trim() || null;
    if (d.status !== undefined) {
      data.status = d.status;
      // Submitting stamps the time, so "submitted" always has a date behind it.
      if (d.status === 'SUBMITTED') data.submittedAt = new Date();
    }
    return this.prisma.grantReportSchedule.update({
      where: { id },
      data,
      include: { grant: { select: { id: true, grantName: true } } },
    });
  }

  // ---------------- Vendors & RFQs ----------------
  listVendors(status?: string) {
    return this.prisma.vendor.findMany({
      where: status ? { status } : {},
      orderBy: { name: 'asc' },
    });
  }

  async createVendor(d: dto.CreateVendorDto) {
    const clash = await this.prisma.vendor.findUnique({
      where: { name: d.name.trim() },
    });
    if (clash) throw new ConflictException('That vendor already exists');
    return this.prisma.vendor.create({
      data: {
        name: d.name.trim(),
        category: d.category?.trim() || null,
        rating: d.rating ?? 0,
        taxId: d.taxId?.trim() || null,
        status: d.status ?? 'PENDING',
        email: d.email?.trim() || null,
        phone: d.phone?.trim() || null,
      },
    });
  }

  async updateVendor(id: string, d: dto.UpdateVendorDto) {
    this.mustExist(
      await this.prisma.vendor.findUnique({ where: { id } }),
      'Vendor',
    );
    const data: Prisma.VendorUpdateInput = {};
    if (d.category !== undefined) data.category = d.category.trim() || null;
    if (d.rating !== undefined) data.rating = d.rating;
    if (d.status !== undefined) data.status = d.status;
    if (d.email !== undefined) data.email = d.email.trim() || null;
    if (d.phone !== undefined) data.phone = d.phone.trim() || null;
    return this.prisma.vendor.update({ where: { id }, data });
  }

  listRfqs(status?: string) {
    return this.prisma.rfq.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        quotes: { include: { vendor: { select: { id: true, name: true } } } },
      },
    });
  }

  async createRfq(d: dto.CreateRfqDto) {
    return createWithReference(
      referencePrefix('RFQ', new Date()),
      (prefix) =>
        this.prisma.rfq.findMany({
          where: { reference: { startsWith: prefix } },
          select: { reference: true },
        }),
      (reference) =>
        this.prisma.rfq.create({
          data: {
            reference,
            description: d.description.trim(),
            closingDate: d.closingDate ? new Date(d.closingDate) : null,
          },
          include: { quotes: true },
        }),
    );
  }

  async createQuote(d: dto.CreateQuoteDto) {
    this.mustExist(
      await this.prisma.rfq.findUnique({ where: { id: d.rfqId } }),
      'RFQ',
    );
    this.mustExist(
      await this.prisma.vendor.findUnique({ where: { id: d.vendorId } }),
      'Vendor',
    );
    const clash = await this.prisma.rfqQuote.findUnique({
      where: { rfqId_vendorId: { rfqId: d.rfqId, vendorId: d.vendorId } },
    });
    if (clash)
      throw new ConflictException('That vendor has already quoted on this RFQ');
    return this.prisma.rfqQuote.create({
      data: {
        rfqId: d.rfqId,
        vendorId: d.vendorId,
        price: d.price,
        warranty: d.warranty?.trim() || null,
        score: d.score ?? 0,
        status: d.status ?? 'SUBMITTED',
      },
      include: { vendor: { select: { id: true, name: true } } },
    });
  }

  /**
   * Recommending a quote demotes any other recommendation on the same RFQ, so an
   * evaluation can never carry two winners.
   */
  async updateQuote(id: string, d: dto.UpdateQuoteDto) {
    const quote = this.mustExist(
      await this.prisma.rfqQuote.findUnique({ where: { id } }),
      'Quote',
    );
    return this.prisma.$transaction(async (tx) => {
      if (d.status === 'RECOMMENDED') {
        await tx.rfqQuote.updateMany({
          where: { rfqId: quote.rfqId, status: 'RECOMMENDED', NOT: { id } },
          data: { status: 'SUBMITTED' },
        });
        await tx.rfq.update({
          where: { id: quote.rfqId },
          data: { status: 'COMPLETE' },
        });
      }
      const data: Prisma.RfqQuoteUpdateInput = {};
      if (d.score !== undefined) data.score = d.score;
      if (d.status !== undefined) data.status = d.status;
      return tx.rfqQuote.update({
        where: { id },
        data,
        include: { vendor: { select: { id: true, name: true } } },
      });
    });
  }

  // ---------------- Annual procurement plan ----------------

  /**
   * quantity x unitPrice, computed on read.
   *
   * There is no stored total column on purpose: a derived value written once is
   * a value that can disagree with its own inputs the moment either is edited.
   */
  private withPlanTotal<
    T extends { quantity: number; unitPrice: Prisma.Decimal },
  >(item: T) {
    return { ...item, totalCost: item.unitPrice.mul(item.quantity).toNumber() };
  }

  async listPlanItems(fiscalYear?: number, status?: string) {
    const items = await this.prisma.procurementPlanItem.findMany({
      where: {
        ...(fiscalYear ? { fiscalYear } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ fiscalYear: 'desc' }, { quarter: 'asc' }],
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    return items.map((item) => this.withPlanTotal(item));
  }

  async createPlanItem(d: dto.CreatePlanItemDto, userId: string) {
    const item = await this.prisma.procurementPlanItem.create({
      data: {
        fiscalYear: d.fiscalYear ?? new Date().getFullYear(),
        category: d.category.trim(),
        description: d.description.trim(),
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        quarter: d.quarter ?? 'Q1',
        priority: d.priority ?? 'MEDIUM',
        createdById: userId,
      },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return this.withPlanTotal(item);
  }

  async updatePlanItem(id: string, d: dto.UpdatePlanItemDto) {
    this.mustExist(
      await this.prisma.procurementPlanItem.findUnique({ where: { id } }),
      'Plan item',
    );
    const data: Prisma.ProcurementPlanItemUpdateInput = {};
    if (d.status !== undefined) data.status = d.status;
    if (d.priority !== undefined) data.priority = d.priority;
    if (d.quarter !== undefined) data.quarter = d.quarter;
    if (d.quantity !== undefined) data.quantity = d.quantity;
    if (d.unitPrice !== undefined) data.unitPrice = d.unitPrice;
    const item = await this.prisma.procurementPlanItem.update({
      where: { id },
      data,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return this.withPlanTotal(item);
  }

  // ---------------- Goods received notes ----------------
  listGrns(procurementOrderId?: string) {
    return this.prisma.goodsReceivedNote.findMany({
      where: procurementOrderId ? { procurementOrderId } : {},
      orderBy: { inspectionDate: 'desc' },
      include: {
        procurementOrder: {
          select: { id: true, itemName: true, quantity: true, vendor: true },
        },
        receivedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async createGrn(d: dto.CreateGrnDto, userId: string) {
    const order = this.mustExist(
      await this.prisma.procurementOrder.findUnique({
        where: { id: d.procurementOrderId },
      }),
      'Purchase order',
    );
    // Receiving more than was ordered is a data-entry error worth refusing, not
    // a number to store and reconcile later.
    if (d.quantity > order.quantity) {
      throw new BadRequestException(
        `Cannot receive ${d.quantity} against an order for ${order.quantity}.`,
      );
    }
    return createWithReference(
      referencePrefix('GRN', new Date()),
      (prefix) =>
        this.prisma.goodsReceivedNote.findMany({
          where: { reference: { startsWith: prefix } },
          select: { reference: true },
        }),
      (reference) =>
        this.prisma.goodsReceivedNote.create({
          data: {
            reference,
            procurementOrderId: d.procurementOrderId,
            deliveryNote: d.deliveryNote.trim(),
            itemsReceived: d.itemsReceived.trim(),
            quantity: d.quantity,
            condition: d.condition ?? 'GOOD',
            inspectionDate: new Date(d.inspectionDate),
            officer: d.officer.trim(),
            remarks: d.remarks?.trim() || null,
            receivedById: userId,
          },
          include: {
            procurementOrder: {
              select: {
                id: true,
                itemName: true,
                quantity: true,
                vendor: true,
              },
            },
            receivedBy: { select: { firstName: true, lastName: true } },
          },
        }),
    );
  }

  // ---------------- Contracts ----------------
  listContracts(status?: string) {
    return this.prisma.contract.findMany({
      where: status ? { status } : {},
      orderBy: { startDate: 'desc' },
      include: {
        vendor: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async createContract(d: dto.CreateContractDto, userId: string) {
    this.mustExist(
      await this.prisma.vendor.findUnique({ where: { id: d.vendorId } }),
      'Vendor',
    );
    if (new Date(d.endDate) < new Date(d.startDate)) {
      throw new BadRequestException('endDate cannot be before startDate');
    }
    return createWithReference(
      referencePrefix('CTR', new Date()),
      (prefix) =>
        this.prisma.contract.findMany({
          where: { reference: { startsWith: prefix } },
          select: { reference: true },
        }),
      (reference) =>
        this.prisma.contract.create({
          data: {
            reference,
            vendorId: d.vendorId,
            title: d.title.trim(),
            value: d.value,
            startDate: new Date(d.startDate),
            endDate: new Date(d.endDate),
            deliverables: d.deliverables?.trim() || null,
            status: d.status ?? 'ACTIVE',
            createdById: userId,
          },
          include: {
            vendor: { select: { id: true, name: true } },
            createdBy: { select: { firstName: true, lastName: true } },
          },
        }),
    );
  }

  async updateContract(id: string, d: dto.UpdateContractDto) {
    const existing = this.mustExist(
      await this.prisma.contract.findUnique({ where: { id } }),
      'Contract',
    );
    if (d.endDate !== undefined && new Date(d.endDate) < existing.startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }
    const data: Prisma.ContractUpdateInput = {};
    if (d.status !== undefined) data.status = d.status;
    if (d.deliverables !== undefined)
      data.deliverables = d.deliverables.trim() || null;
    if (d.endDate !== undefined) data.endDate = new Date(d.endDate);
    return this.prisma.contract.update({
      where: { id },
      data,
      include: {
        vendor: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }
}
