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
const roles_constants_1 = require("../auth/roles.constants");
const participant_access_guard_1 = require("../phi/participant-access.guard");
const phi_access_service_1 = require("../phi/phi-access.service");
let FollowUpController = class FollowUpController {
    followUpService;
    phi;
    constructor(followUpService, phi) {
        this.followUpService = followUpService;
        this.phi = phi;
    }
    async getAll(req, status) {
        return this.followUpService.getAll(status, this.phi.participantScope(req.user));
    }
    async getDashboardStats(req) {
        return this.followUpService.getDashboardStats(this.phi.participantScope(req.user));
    }
    async getUpcoming(req, days) {
        return this.followUpService.getUpcoming(days ? parseInt(days) : 7, this.phi.participantScope(req.user));
    }
    async getMissed(req) {
        return this.followUpService.getMissed(this.phi.participantScope(req.user));
    }
    async getOne(id, req) {
        return this.followUpService.getOne(id, this.phi.participantScope(req.user));
    }
    async create(body, req) {
        return this.followUpService.create({
            ...body,
            clinicianId: body.clinicianId || req.user.id,
        });
    }
    async updateStatus(id, body, req) {
        return this.followUpService.updateStatus(id, body.status, body.notes, req.user);
    }
};
exports.FollowUpController = FollowUpController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('dashboard-stats'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)('missed'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getMissed", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CLINICIAN', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN'),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
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
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FollowUpController.prototype, "updateStatus", null);
exports.FollowUpController = FollowUpController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('follow-ups'),
    __metadata("design:paramtypes", [follow_up_service_1.FollowUpService,
        phi_access_service_1.PhiAccessService])
], FollowUpController);
//# sourceMappingURL=follow-up.controller.js.map