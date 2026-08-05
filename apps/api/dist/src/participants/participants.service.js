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
exports.ParticipantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const phi_access_service_1 = require("../phi/phi-access.service");
let ParticipantsService = class ParticipantsService {
    prisma;
    phi;
    constructor(prisma, phi) {
        this.prisma = prisma;
        this.phi = phi;
    }
    async create(data) {
        try {
            return await this.prisma.participant.create({ data });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Participant with this National ID already exists');
            }
            throw error;
        }
    }
    async findAll(actor, search) {
        const where = {
            ...this.phi.participantScope(actor),
        };
        const query = search?.trim();
        if (query) {
            where.AND = [
                {
                    OR: [
                        { firstName: { contains: query } },
                        { lastName: { contains: query } },
                        { nationalId: { contains: query } },
                        { phoneNumber: { contains: query } },
                    ],
                },
            ];
        }
        return this.prisma.participant.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, actor) {
        await this.phi.assertParticipantAccess(actor, id, 'GET /participants/:id');
        const p = await this.prisma.participant.findUnique({
            where: { id },
            include: {
                screenings: { orderBy: { createdAt: 'desc' } },
                referrals: {
                    include: {
                        referredBy: { select: { firstName: true, lastName: true } },
                    },
                },
                navigationEvents: { orderBy: { date: 'asc' } },
                clinicalEncounters: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        clinician: { select: { firstName: true, lastName: true } },
                    },
                },
                followUps: { orderBy: { scheduledDate: 'asc' } },
                assignments: {
                    include: {
                        clinician: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
        if (!p)
            throw new common_1.NotFoundException('Participant not found');
        return p;
    }
};
exports.ParticipantsService = ParticipantsService;
exports.ParticipantsService = ParticipantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        phi_access_service_1.PhiAccessService])
], ParticipantsService);
//# sourceMappingURL=participants.service.js.map