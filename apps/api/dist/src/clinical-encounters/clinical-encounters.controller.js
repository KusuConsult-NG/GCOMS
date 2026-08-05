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
let ClinicalEncountersController = class ClinicalEncountersController {
    encountersService;
    constructor(encountersService) {
        this.encountersService = encountersService;
    }
    createEncounter(data, req) {
        return this.encountersService.createEncounter(data, req.user.id);
    }
    getEncounters(id) {
        return this.encountersService.getEncounters(id);
    }
    editEncounter(id, data, req) {
        if (req.user.role !== 'CLINICIAN') {
            throw new common_1.UnauthorizedException('Only clinicians can edit encounters');
        }
        return this.encountersService.editEncounter(id, data.notes, req.user.id);
    }
    assignPatient(data, req) {
        if (req.user.role !== 'CLINICIAN' && req.user.role !== 'EXECUTIVE' && req.user.role !== 'ADMIN') {
            throw new common_1.UnauthorizedException('Not authorized to assign patients');
        }
        return this.encountersService.assignPatient(data, req.user.id);
    }
    getAssignments(req) {
        return this.encountersService.getAssignments(req.user.role === 'CLINICIAN' ? req.user.id : undefined);
    }
};
exports.ClinicalEncountersController = ClinicalEncountersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "createEncounter", null);
__decorate([
    (0, common_1.Get)('participant/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "getEncounters", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "editEncounter", null);
__decorate([
    (0, common_1.Post)('assignments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "assignPatient", null);
__decorate([
    (0, common_1.Get)('assignments'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicalEncountersController.prototype, "getAssignments", null);
exports.ClinicalEncountersController = ClinicalEncountersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('clinical-encounters'),
    __metadata("design:paramtypes", [clinical_encounters_service_1.ClinicalEncountersService])
], ClinicalEncountersController);
//# sourceMappingURL=clinical-encounters.controller.js.map