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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const approvals_service_1 = require("./approvals.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ApprovalsController = class ApprovalsController {
    approvalsService;
    constructor(approvalsService) {
        this.approvalsService = approvalsService;
    }
    createRequest(data, req) {
        return this.approvalsService.createRequest(data, req.user.id);
    }
    getRequests(req) {
        if (!['EXECUTIVE', 'ADMIN', 'SYSTEM_ADMIN'].includes(req.user.role)) {
            throw new common_1.UnauthorizedException('Only Executive and Admin roles can view approvals');
        }
        return this.approvalsService.getPendingRequests();
    }
    getPendingRequests(req) {
        return this.getRequests(req);
    }
    resolveRequest(id, data, req) {
        if (req.user.role !== 'EXECUTIVE') {
            throw new common_1.UnauthorizedException('Only Executives can resolve approvals');
        }
        return this.approvalsService.resolveRequest(id, data.status, req.user.id);
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "resolveRequest", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('approvals'),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map