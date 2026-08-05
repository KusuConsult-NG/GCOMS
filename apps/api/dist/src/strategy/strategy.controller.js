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
exports.StrategyController = void 0;
const common_1 = require("@nestjs/common");
const strategy_service_1 = require("./strategy.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const strategy_dto_1 = require("./dto/strategy.dto");
let StrategyController = class StrategyController {
    strategyService;
    constructor(strategyService) {
        this.strategyService = strategyService;
    }
    createGoal(data) {
        return this.strategyService.createGoal(data);
    }
    getGoals() {
        return this.strategyService.getGoals();
    }
    updateGoal(id, data) {
        return this.strategyService.updateGoal(id, data);
    }
};
exports.StrategyController = StrategyController;
__decorate([
    (0, common_1.Post)('goals'),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'BOARD'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [strategy_dto_1.CreateStrategicGoalDto]),
    __metadata("design:returntype", void 0)
], StrategyController.prototype, "createGoal", null);
__decorate([
    (0, common_1.Get)('goals'),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'BOARD', 'SYSTEM_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StrategyController.prototype, "getGoals", null);
__decorate([
    (0, common_1.Patch)('goals/:id'),
    (0, roles_decorator_1.Roles)('EXECUTIVE', 'BOARD'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, strategy_dto_1.UpdateStrategicGoalDto]),
    __metadata("design:returntype", void 0)
], StrategyController.prototype, "updateGoal", null);
exports.StrategyController = StrategyController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('strategy'),
    __metadata("design:paramtypes", [strategy_service_1.StrategyService])
], StrategyController);
//# sourceMappingURL=strategy.controller.js.map