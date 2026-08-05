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
exports.ScreeningsController = void 0;
const common_1 = require("@nestjs/common");
const screenings_service_1 = require("./screenings.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_constants_1 = require("../auth/roles.constants");
const participant_access_guard_1 = require("../phi/participant-access.guard");
let ScreeningsController = class ScreeningsController {
    screeningsService;
    constructor(screeningsService) {
        this.screeningsService = screeningsService;
    }
    createScreening(data, req) {
        return this.screeningsService.createScreening(data, req.user.id);
    }
    getScreenings(id) {
        return this.screeningsService.getScreenings(id);
    }
};
exports.ScreeningsController = ScreeningsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CLINICIAN', 'FIELD_OFFICER', 'COMMUNITY_HEALTH_WORKER', 'EXECUTIVE', 'ADMIN'),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScreeningsController.prototype, "createScreening", null);
__decorate([
    (0, common_1.Get)('participant/:id'),
    (0, roles_decorator_1.Roles)(...roles_constants_1.PHI_READ_ROLES),
    (0, common_1.UseGuards)(participant_access_guard_1.ParticipantAccessGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScreeningsController.prototype, "getScreenings", null);
exports.ScreeningsController = ScreeningsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('screenings'),
    __metadata("design:paramtypes", [screenings_service_1.ScreeningsService])
], ScreeningsController);
//# sourceMappingURL=screenings.controller.js.map