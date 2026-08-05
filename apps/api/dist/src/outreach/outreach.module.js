"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutreachModule = void 0;
const common_1 = require("@nestjs/common");
const outreach_service_1 = require("./outreach.service");
const outreach_controller_1 = require("./outreach.controller");
const prisma_service_1 = require("../prisma/prisma.service");
let OutreachModule = class OutreachModule {
};
exports.OutreachModule = OutreachModule;
exports.OutreachModule = OutreachModule = __decorate([
    (0, common_1.Module)({
        providers: [outreach_service_1.OutreachService, prisma_service_1.PrismaService],
        controllers: [outreach_controller_1.OutreachController]
    })
], OutreachModule);
//# sourceMappingURL=outreach.module.js.map