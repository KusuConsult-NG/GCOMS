import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhiAccessService, PhiActor } from '../phi/phi-access.service';

@Injectable()
export class ClinicalEncountersService {
  constructor(
    private prisma: PrismaService,
    private phi: PhiAccessService,
  ) {}

  async createEncounter(data: any, userId: string) {
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

  async assignPatient(data: any, assignedBy: string) {
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
}
