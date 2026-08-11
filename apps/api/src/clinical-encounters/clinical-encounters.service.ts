import { AssignPatientDto, CreateEncounterDto } from './dto/encounter.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
import { DIAGNOSING_WRITE_ROLES, Role } from '../auth/roles.constants';
import {
  CreateInvestigationDto,
  UpdateInvestigationDto,
} from './dto/investigation.dto';

@Injectable()
export class ClinicalEncountersService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  /**
   * Record an encounter. A prognosis is a separate act.
   *
   * The route admits CLINICAL_WRITE_ROLES, which includes NURSE, and it should:
   * a nurse in a screening programme does the bulk of the work, and
   * roles.constants warns that getting this wrong in the restrictive direction
   * "stops a nurse doing their job and gets worked around".
   *
   * But the same comment reserves one thing by name — "the interpretive step: a
   * prognosis, and the recommendation drawn from an investigation result" — to
   * DIAGNOSING_ROLES. That was enforced on the edit route and on investigations,
   * and not here, so the single field the policy singles out was writable at
   * creation by the role the policy excludes.
   *
   * Refused rather than quietly dropped. Silently discarding it would leave the
   * nurse believing a prognosis had been recorded and the patient's record
   * without one, which is the failure this system keeps producing in other
   * forms.
   */
  async createEncounter(
    data: CreateEncounterDto,
    actor: { id: string; role: string },
  ) {
    if (
      data.prognosis?.trim() &&
      !DIAGNOSING_WRITE_ROLES.includes(actor.role as Role)
    ) {
      throw new ForbiddenException(
        'A prognosis is a diagnostic conclusion and may only be recorded by ' +
          `${DIAGNOSING_WRITE_ROLES.join(', ')}. Record the encounter without ` +
          'one; a clinician can add it.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const encounter = await tx.clinicalEncounter.create({
        data: {
          notes: data.notes,
          prognosis: data.prognosis,
          cancerType: data.cancerType,
          participantId: data.participantId,
          clinicianId: actor.id,
        },
      });

      /*
       * An edit to a note was audited and its creation was not, so the trail
       * for a record began at the first change to it. Reviewing a note that had
       * never been edited meant reading the row and taking its word for who
       * wrote it — and `clinicianId` is a column on a mutable row.
       */
      await tx.auditLog.create({
        data: {
          action: 'CREATE_CLINICAL_NOTE',
          newData: data.notes,
          userId: actor.id,
          clinicalEncounterId: encounter.id,
        },
      });

      return encounter;
    });
  }

  async getEncounters(participantId: string) {
    return this.prisma.clinicalEncounter.findMany({
      where: { participantId },
      orderBy: { createdAt: 'desc' },
      include: {
        clinician: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  async editEncounter(
    id: string,
    newNotes: string,
    userId: string,
    actor: PhiActor,
  ) {
    const encounter = await this.prisma.clinicalEncounter.findUnique({
      where: { id },
    });
    if (!encounter) throw new NotFoundException('Encounter not found');

    await this.phi.assertParticipantAccess(
      actor,
      encounter.participantId,
      'PATCH /clinical-encounters/:id',
    );

    return this.prisma.$transaction(async (tx) => {
      // Create Audit Log
      await tx.auditLog.create({
        data: {
          action: 'EDIT_CLINICAL_NOTE',
          oldData: encounter.notes,
          newData: newNotes,
          userId,
          clinicalEncounterId: id,
        },
      });

      // Update Encounter
      return tx.clinicalEncounter.update({
        where: { id },
        data: { notes: newNotes },
      });
    });
  }

  /**
   * Puts a clinician on a patient's caseload.
   *
   * `assignedBy` used to be accepted and then dropped on the floor: the
   * PatientAssignment row has no column for it, so there was no record of who
   * granted the access. It is written to the audit log instead, in the same
   * transaction, because an assignment is what widens a clinician's PHI scope.
   */
  async assignPatient(data: AssignPatientDto, assignedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.patientAssignment.create({
        data: {
          participantId: data.participantId,
          clinicianId: data.clinicianId,
          status: 'ACTIVE',
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'ASSIGN_PATIENT',
          userId: assignedBy,
          newData: JSON.stringify({
            participantId: data.participantId,
            clinicianId: data.clinicianId,
            assignmentId: assignment.id,
          }),
        },
      });

      return assignment;
    });
  }

  async getAssignments(clinicianId?: string) {
    const where = clinicianId ? { clinicianId } : {};
    return this.prisma.patientAssignment.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
      include: {
        participant: true,
        clinician: { select: { firstName: true, lastName: true, role: true } },
      },
    });
  }

  /*
   * Investigations. The table existed with no endpoint, so results and the
   * recommendations drawn from them had nowhere to live.
   *
   * These are patient records, so every path resolves the owning participant
   * and runs the same check as the rest of the clinical module — including the
   * audited break-glass route for a patient outside the caller's caseload.
   */

  private async encounterParticipant(encounterId: string): Promise<string> {
    const encounter = await this.prisma.clinicalEncounter.findUnique({
      where: { id: encounterId },
      select: { participantId: true },
    });
    if (!encounter) throw new NotFoundException('Encounter not found');
    return encounter.participantId;
  }

  async listInvestigations(encounterId: string, actor: PhiActor) {
    const participantId = await this.encounterParticipant(encounterId);
    await this.phi.assertParticipantAccess(
      actor,
      participantId,
      'GET /clinical-encounters/:id/investigations',
    );
    return this.prisma.investigation.findMany({
      where: { clinicalEncounterId: encounterId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvestigation(dto: CreateInvestigationDto, actor: PhiActor) {
    const participantId = await this.encounterParticipant(
      dto.clinicalEncounterId,
    );
    await this.phi.assertParticipantAccess(
      actor,
      participantId,
      'POST /clinical-encounters/investigations',
    );
    return this.prisma.investigation.create({
      data: {
        clinicalEncounterId: dto.clinicalEncounterId,
        type: dto.type.trim(),
        results: dto.results?.trim() || null,
        recommendation: dto.recommendation?.trim() || null,
      },
    });
  }

  async updateInvestigation(
    id: string,
    dto: UpdateInvestigationDto,
    actor: PhiActor,
  ) {
    const existing = await this.prisma.investigation.findUnique({
      where: { id },
      select: { id: true, clinicalEncounterId: true },
    });
    if (!existing) throw new NotFoundException('Investigation not found');

    const participantId = await this.encounterParticipant(
      existing.clinicalEncounterId,
    );
    await this.phi.assertParticipantAccess(
      actor,
      participantId,
      'PATCH /clinical-encounters/investigations/:id',
    );

    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type.trim();
    if (dto.results !== undefined) data.results = dto.results.trim() || null;
    if (dto.recommendation !== undefined)
      data.recommendation = dto.recommendation.trim() || null;

    return this.prisma.investigation.update({ where: { id }, data });
  }
}
