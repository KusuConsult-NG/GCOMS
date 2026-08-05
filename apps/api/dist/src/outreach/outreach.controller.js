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
exports.OutreachController = void 0;
const common_1 = require("@nestjs/common");
const outreach_service_1 = require("./outreach.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let OutreachController = class OutreachController {
    outreachService;
    constructor(outreachService) {
        this.outreachService = outreachService;
    }
    async getAllOutreaches() {
        return this.outreachService.getAllOutreaches();
    }
    async getOutreach(id) {
        return this.outreachService.getOutreach(id);
    }
    async createOutreach(body) {
        return this.outreachService.createOutreach(body);
    }
    async assignVolunteerTask(outreachId, body) {
        return this.outreachService.assignVolunteerTask(outreachId, body.volunteerId, body.title);
    }
    async logVolunteerHours(taskId, body) {
        return this.outreachService.logVolunteerHours(taskId, body.hours);
    }
};
exports.OutreachController = OutreachController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutreachController.prototype, "getAllOutreaches", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OutreachController.prototype, "getOutreach", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OutreachController.prototype, "createOutreach", null);
__decorate([
    (0, common_1.Post)(':id/tasks'),
    (0, roles_decorator_1.Roles)('ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OutreachController.prototype, "assignVolunteerTask", null);
__decorate([
    (0, common_1.Post)('tasks/:taskId/hours'),
    (0, roles_decorator_1.Roles)('VOLUNTEER', 'FIELD_OFFICER', 'EXECUTIVE', 'ADMIN'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OutreachController.prototype, "logVolunteerHours", null);
exports.OutreachController = OutreachController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('outreach'),
    __metadata("design:paramtypes", [outreach_service_1.OutreachService])
], OutreachController);
//# sourceMappingURL=outreach.controller.js.map