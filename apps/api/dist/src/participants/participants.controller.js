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
exports.ParticipantsController = void 0;
const common_1 = require("@nestjs/common");
const participants_service_1 = require("./participants.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ParticipantsController = class ParticipantsController {
    participantsService;
    constructor(participantsService) {
        this.participantsService = participantsService;
    }
    create(createParticipantDto, req) {
        const data = {
            ...createParticipantDto,
            dateOfBirth: new Date(createParticipantDto.dateOfBirth),
            registeredBy: {
                connect: { id: req.user.id }
            }
        };
        return this.participantsService.create(data);
    }
    findAll(search) {
        return this.participantsService.findAll(search);
    }
    findOne(id) {
        return this.participantsService.findOne(id);
    }
};
exports.ParticipantsController = ParticipantsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ParticipantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParticipantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParticipantsController.prototype, "findOne", null);
exports.ParticipantsController = ParticipantsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('participants'),
    __metadata("design:paramtypes", [participants_service_1.ParticipantsService])
], ParticipantsController);
//# sourceMappingURL=participants.controller.js.map