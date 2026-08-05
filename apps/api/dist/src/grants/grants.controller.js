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
exports.GrantsController = void 0;
const common_1 = require("@nestjs/common");
const grants_service_1 = require("./grants.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let GrantsController = class GrantsController {
    grantsService;
    constructor(grantsService) {
        this.grantsService = grantsService;
    }
    createGrant(data, req) {
        if (req.user.role !== 'EXECUTIVE' && req.user.role !== 'GRANT_MANAGER') {
            throw new common_1.UnauthorizedException('Only Executives or Grant Managers can create grants');
        }
        return this.grantsService.createGrant(data, req.user.id);
    }
    getGrants(req) {
        return this.grantsService.getGrants();
    }
};
exports.GrantsController = GrantsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GrantsController.prototype, "createGrant", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GrantsController.prototype, "getGrants", null);
exports.GrantsController = GrantsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('grants'),
    __metadata("design:paramtypes", [grants_service_1.GrantsService])
], GrantsController);
//# sourceMappingURL=grants.controller.js.map