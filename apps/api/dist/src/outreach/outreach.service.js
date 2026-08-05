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
exports.OutreachService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OutreachService = class OutreachService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllOutreaches() {
        return this.prisma.outreach.findMany({
            include: { location: true, tasks: { include: { volunteer: { select: { firstName: true, lastName: true } } } } },
            orderBy: { date: 'desc' },
        });
    }
    async getOutreach(id) {
        const outreach = await this.prisma.outreach.findUnique({
            where: { id },
            include: { location: true, tasks: { include: { volunteer: { select: { firstName: true, lastName: true } } } } }
        });
        if (!outreach)
            throw new common_1.NotFoundException('Outreach not found');
        return outreach;
    }
    async createOutreach(data) {
        let locationId = data.locationId;
        if (!locationId) {
            const defaultLocation = await this.prisma.location.findFirst();
            if (defaultLocation) {
                locationId = defaultLocation.id;
            }
            else {
                const newLocation = await this.prisma.location.create({
                    data: { name: 'Main Office', lga: 'Jos North', state: 'Plateau State' },
                });
                locationId = newLocation.id;
            }
        }
        return this.prisma.outreach.create({
            data: {
                title: data.title,
                locationId,
                date: new Date(data.date),
                status: 'PLANNED',
            },
            include: { location: true },
        });
    }
    async assignVolunteerTask(outreachId, volunteerId, title) {
        return this.prisma.volunteerTask.create({
            data: { title, outreachId, volunteerId },
        });
    }
    async logVolunteerHours(taskId, hours) {
        return this.prisma.volunteerTask.update({
            where: { id: taskId },
            data: { hoursLogged: hours, status: 'COMPLETED' },
        });
    }
};
exports.OutreachService = OutreachService;
exports.OutreachService = OutreachService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OutreachService);
//# sourceMappingURL=outreach.service.js.map