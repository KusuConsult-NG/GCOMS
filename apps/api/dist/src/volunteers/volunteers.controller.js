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
exports.VolunteersController = void 0;
const common_1 = require("@nestjs/common");
const volunteers_service_1 = require("./volunteers.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let VolunteersController = class VolunteersController {
    volunteersService;
    constructor(volunteersService) {
        this.volunteersService = volunteersService;
    }
    async getVolunteers() {
        return this.volunteersService.getVolunteers();
    }
    async assignTask(body) {
        return this.volunteersService.assignTask(body);
    }
    async logHours(taskId, body) {
        return this.volunteersService.logHours(taskId, body.hours);
    }
};
exports.VolunteersController = VolunteersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VolunteersController.prototype, "getVolunteers", null);
__decorate([
    (0, common_1.Post)('tasks'),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'FIELD_OFFICER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VolunteersController.prototype, "assignTask", null);
__decorate([
    (0, common_1.Put)('tasks/:taskId/hours'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VolunteersController.prototype, "logHours", null);
exports.VolunteersController = VolunteersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('volunteers'),
    __metadata("design:paramtypes", [volunteers_service_1.VolunteersService])
], VolunteersController);
//# sourceMappingURL=volunteers.controller.js.map