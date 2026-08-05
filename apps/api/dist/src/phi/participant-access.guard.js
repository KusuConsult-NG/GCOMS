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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const phi_access_service_1 = require("./phi-access.service");
let ParticipantAccessGuard = class ParticipantAccessGuard {
    phi;
    constructor(phi) {
        this.phi = phi;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const participantId = request.params?.participantId ??
            request.params?.id ??
            request.body?.participantId;
        if (!participantId || !request.user) {
            return true;
        }
        await this.phi.assertParticipantAccess(request.user, participantId, `${request.method} ${request.route?.path ?? request.url}`);
        return true;
    }
};
exports.ParticipantAccessGuard = ParticipantAccessGuard;
exports.ParticipantAccessGuard = ParticipantAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [phi_access_service_1.PhiAccessService])
], ParticipantAccessGuard);
//# sourceMappingURL=participant-access.guard.js.map