"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalEncountersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ClinicalEncountersService = class ClinicalEncountersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEncounter(data, userId) {
        return this.prisma.clinicalEncounter.create({
            data: {
                notes: data.notes,
                prognosis: data.prognosis,
                participantId: data.participantId,
                clinicianId: userId,
            }
        });
    }
    async getEncounters(participantId) {
        return this.prisma.clinicalEncounter.findMany({
            where: { participantId },
            orderBy: { createdAt: 'desc' },
            include: {
                clinician: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }
    async editEncounter(id, newNotes, userId) {
        const encounter = await this.prisma.clinicalEncounter.findUnique({ where: { id } });
        if (!encounter)
            throw new common_1.NotFoundException('Encounter not found');
        return this.prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    action: 'EDIT_CLINICAL_NOTE',
                    oldData: encounter.notes,
                    newData: newNotes,
                    userId,
                    clinicalEncounterId: id,
                }
            });
            return tx.clinicalEncounter.update({
                where: { id },
                data: { notes: newNotes }
            });
        });
    }
    async assignPatient(data, assignedBy) {
        return this.prisma.patientAssignment.create({
            data: {
                participantId: data.participantId,
                clinicianId: data.clinicianId,
                status: 'ACTIVE'
            }
        });
    }
    async getAssignments(clinicianId) {
        const where = clinicianId ? { clinicianId } : {};
        return this.prisma.patientAssignment.findMany({
            where,
            orderBy: { assignedAt: 'desc' },
            include: {
                participant: true,
                clinician: { select: { firstName: true, lastName: true, role: true } }
            }
        });
    }
};
exports.ClinicalEncountersService = ClinicalEncountersService;
exports.ClinicalEncountersService = ClinicalEncountersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClinicalEncountersService);
//# sourceMappingURL=clinical-encounters.service.js.map