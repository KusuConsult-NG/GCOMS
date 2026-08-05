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
exports.SystemAdminController = void 0;
const common_1 = require("@nestjs/common");
const system_admin_service_1 = require("./system-admin.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const update_system_config_dto_1 = require("./dto/update-system-config.dto");
let SystemAdminController = class SystemAdminController {
    systemAdminService;
    constructor(systemAdminService) {
        this.systemAdminService = systemAdminService;
    }
    setConfig(data, req) {
        return this.systemAdminService.setConfig(data.key, data.value);
    }
    getConfigs(req) {
        return this.systemAdminService.getConfigs();
    }
};
exports.SystemAdminController = SystemAdminController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'SYSTEM_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_system_config_dto_1.UpdateSystemConfigDto, Object]),
    __metadata("design:returntype", void 0)
], SystemAdminController.prototype, "setConfig", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'SYSTEM_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SystemAdminController.prototype, "getConfigs", null);
exports.SystemAdminController = SystemAdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('system-admin/config'),
    __metadata("design:paramtypes", [system_admin_service_1.SystemAdminService])
], SystemAdminController);
//# sourceMappingURL=system-admin.controller.js.map