import { AssignPatientDto, CreateEncounterDto } from './dto/encounter.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';
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

  async createEncounter(data: CreateEncounterDto, userId: string) {
    return this.prisma.clinicalEncounter.create({
      data: {
        notes: data.notes,
        prognosis: data.prognosis,
        participantId: data.participantId,
        clinicianId: userId,
      },
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

  async assignPatient(data: AssignPatientDto, assignedBy: string) {
    return this.prisma.patientAssignment.create({
      data: {
        participantId: data.participantId,
        clinicianId: data.clinicianId,
        status: 'ACTIVE',
      },
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
