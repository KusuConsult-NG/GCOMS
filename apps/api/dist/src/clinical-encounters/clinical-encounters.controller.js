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
exports.ClinicalEncountersController = void 0;
const common_1 = require("@nestjs/common");
const clinical_encounters_service_1 = require("./clinical-encounters.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_constants_1 = require("../auth/roles.constants");
const participant_access_guard_1 = require("../phi/participant-access.guard");
const phi_access_service_1 = require("../phi/phi-access.service");
let ClinicalEncountersController = class ClinicalEncountersController {
    encountersService;
    phi;
    constructor(encountersService, phi) {
        this.encountersService = encountersService;
        this.phi = phi;
    }
    createEncounter(data, req) {
        return this.encountersService.createEncounter(data, req.user.id);
    }
    getEncounters(id) {
        return this.encountersService.getEncounters(id);
    }
    editEncounter(id, data, req) {
        return this.encountersService.editEncounter(id, data.notes, req.user.id, req.user);
    }
    assignPatient(data, req) {
        return this.encountersService.assignPatient(data, req.user.id);
    }
    getAssignments(req) {
        const clinicianId = this.phi.isUnscoped(req.user.role)
            ? undefined
            : req.user.id;
        return this.encountersService.getAssignments(clinicianId);
    }
};
exports.ClinicalEncountersController = ClinicalEncountersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CLINICIAN', 'EXECUTIVE', 'ADMIN'),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "createEncounter", null);
__decorate([
    (0, common_1.Get)('participant/:id'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "getEncounters", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('CLINICIAN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "editEncounter", null);
__decorate([
    (0, common_1.Post)('assignments'),
    (0, roles_decorator_1.Roles)('CLINICIAN', 'EXECUTIVE', 'ADMIN'),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "assignPatient", null);
__decorate([
    (0, common_1.Get)('assignments'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "getAssignments", null);
exports.ClinicalEncountersController = ClinicalEncountersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('clinical-encounters'),
    __metadata("design:paramtypes", [clinical_encounters_service_1.ClinicalEncountersService,
        phi_access_service_1.PhiAccessService])
], ClinicalEncountersController);
//# sourceMappingURL=clinical-encounters.controller.js.map