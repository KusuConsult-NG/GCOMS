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
exports.GovernanceController = void 0;
const common_1 = require("@nestjs/common");
const governance_service_1 = require("./governance.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const create_governance_meeting_dto_1 = require("./dto/create-governance-meeting.dto");
let GovernanceController = class GovernanceController {
    governanceService;
    constructor(governanceService) {
        this.governanceService = governanceService;
    }
    scheduleMeeting(data, req) {
        return this.governanceService.scheduleMeeting(data, req.user.id);
    }
    getMeetings() {
        return this.governanceService.getMeetings();
    }
};
exports.GovernanceController = GovernanceController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'BOARD'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_governance_meeting_dto_1.CreateGovernanceMeetingDto, Object]),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "scheduleMeeting", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'BOARD'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "getMeetings", null);
exports.GovernanceController = GovernanceController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('governance/meetings'),
    __metadata("design:paramtypes", [governance_service_1.GovernanceService])
], GovernanceController);
//# sourceMappingURL=governance.controller.js.map