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
exports.MedicalHistoryController = void 0;
const common_1 = require("@nestjs/common");
const medical_history_service_1 = require("./medical-history.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_constants_1 = require("../auth/roles.constants");
const participant_access_guard_1 = require("../phi/participant-access.guard");
let MedicalHistoryController = class MedicalHistoryController {
    historyService;
    constructor(historyService) {
        this.historyService = historyService;
    }
    async create(body) {
        return this.historyService.create(body);
    }
    async getByParticipant(participantId) {
        return this.historyService.findByParticipant(participantId);
    }
};
exports.MedicalHistoryController = MedicalHistoryController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CLINICIAN', 'EXECUTIVE', 'ADMIN'),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MedicalHistoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('participant/:participantId'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
    __param(0, (0, common_1.Param)('participantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MedicalHistoryController.prototype, "getByParticipant", null);
exports.MedicalHistoryController = MedicalHistoryController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('medical-history'),
    __metadata("design:paramtypes", [medical_history_service_1.MedicalHistoryService])
], MedicalHistoryController);
//# sourceMappingURL=medical-history.controller.js.map