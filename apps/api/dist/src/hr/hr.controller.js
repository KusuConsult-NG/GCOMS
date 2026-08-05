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
exports.HrController = void 0;
const common_1 = require("@nestjs/common");
const hr_service_1 = require("./hr.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let HrController = class HrController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    createStaffRecord(data, req) {
        if (!['HR', 'EXECUTIVE', 'ADMIN', 'SYSTEM_ADMIN'].includes(req.user.role)) {
            throw new common_1.UnauthorizedException('Only HR, Executive, and Admin roles can manage staff');
        }
        return this.hrService.createStaffRecord(data, req.user.id);
    }
    createStaffRecordAlias(data, req) {
        return this.createStaffRecord(data, req);
    }
    getStaffRecords(req) {
        if (!['HR', 'EXECUTIVE', 'ADMIN', 'SYSTEM_ADMIN'].includes(req.user.role)) {
            throw new common_1.UnauthorizedException('Only HR, Executive, and Admin roles can view staff records');
        }
        return this.hrService.getStaffRecords();
    }
    getStaffRecordsAlias(req) {
        return this.getStaffRecords(req);
    }
};
exports.HrController = HrController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createStaffRecord", null);
__decorate([
    (0, common_1.Post)('staff'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createStaffRecordAlias", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getStaffRecords", null);
__decorate([
    (0, common_1.Get)('staff'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getStaffRecordsAlias", null);
exports.HrController = HrController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('hr'),
    __metadata("design:paramtypes", [hr_service_1.HrService])
], HrController);
//# sourceMappingURL=hr.controller.js.map