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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpController = void 0;
const common_1 = require("@nestjs/common");
const follow_up_service_1 = require("./follow-up.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let FollowUpController = class FollowUpController {
    followUpService;
    constructor(followUpService) {
        this.followUpService = followUpService;
    }
    async getAll(status, req) {
        const isClinicianView = req.user.role === 'CLINICIAN';
        const clinicianId = isClinicianView ? req.user.id : undefined;
        return this.followUpService.getAll(status, clinicianId);
    }
    async getDashboardStats() {
        return this.followUpService.getDashboardStats();
    }
    async getUpcoming(days) {
        return this.followUpService.getUpcoming(days ? parseInt(days) : 7);
    }
    async getMissed() {
        return this.followUpService.getMissed();
    }
    async getOne(id) {
        return this.followUpService.getOne(id);
    }
    async create(body, req) {
        return this.followUpService.create({
            ...body,
            clinicianId: body.clinicianId || req.user.id,
        });
    }
    async updateStatus(id, body) {
        return this.followUpService.updateStatus(id, body.status, body.notes);
    }
};
exports.FollowUpController = FollowUpController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('dashboard-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)('missed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getMissed", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "updateStatus", null);
exports.FollowUpController = FollowUpController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('follow-ups'),
    __metadata("design:paramtypes", [follow_up_service_1.FollowUpService])
], FollowUpController);
//# sourceMappingURL=follow-up.controller.js.map