"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = exports.userSelect = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const roles_constants_1 = require("../auth/roles.constants");
exports.userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    createdAt: true,
    password: false,
};
const BCRYPT_ROUNDS = 12;
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(role) {
        return this.prisma.user.findMany({
            where: role ? { role } : undefined,
            select: exports.userSelect,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(email) {
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        return this.prisma.user.findUnique({
            where: { email: cleanEmail },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: exports.userSelect,
        });
    }
    async createUser(dto, actorRole) {
        const requestedRole = dto.role ?? roles_constants_1.DEFAULT_ROLE;
        if (roles_constants_1.PRIVILEGED_ROLES.includes(requestedRole) &&
            !roles_constants_1.GRANTOR_ROLES.includes(actorRole)) {
            throw new common_1.ForbiddenException(`Only ${roles_constants_1.GRANTOR_ROLES.join(' or ')} may assign the ${requestedRole} role`);
        }
        const email = dto.email.trim().toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        return this.prisma.user.create({
            data: {
                email,
                password,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                role: requestedRole,
            },
            select: exports.userSelect,
        });
    }
    async updateRole(id, dto, actor) {
        if (!roles_constants_1.GRANTOR_ROLES.includes(actor.role)) {
            throw new common_1.ForbiddenException(`Only ${roles_constants_1.GRANTOR_ROLES.join(' or ')} may change user roles`);
        }
        if (id === actor.id) {
            throw new common_1.ForbiddenException('You cannot change your own role. Ask another administrator.');
        }
        const target = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, role: true },
        });
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (target.role === dto.role) {
            return this.findById(id);
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id },
                data: { role: dto.role },
                select: exports.userSelect,
            });
            await tx.auditLog.create({
                data: {
                    action: 'USER_ROLE_CHANGED',
                    oldData: JSON.stringify({
                        userId: target.id,
                        email: target.email,
                        role: target.role,
                    }),
                    newData: JSON.stringify({
                        userId: target.id,
                        email: target.email,
                        role: dto.role,
                    }),
                    userId: actor.id,
                },
            });
            return updated;
        });
    }
    async updateStatus(id, dto, actor) {
        if (!roles_constants_1.GRANTOR_ROLES.includes(actor.role)) {
            throw new common_1.ForbiddenException(`Only ${roles_constants_1.GRANTOR_ROLES.join(' or ')} may activate or deactivate accounts`);
        }
        if (id === actor.id) {
            throw new common_1.ForbiddenException('You cannot deactivate your own account. Ask another administrator.');
        }
        const target = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, isActive: true },
        });
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (target.isActive === dto.isActive) {
            return this.findById(id);
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id },
                data: { isActive: dto.isActive },
                select: exports.userSelect,
            });
            await tx.auditLog.create({
                data: {
                    action: 'USER_STATUS_CHANGED',
                    oldData: JSON.stringify({
                        userId: target.id,
                        email: target.email,
                        isActive: target.isActive,
                    }),
                    newData: JSON.stringify({
                        userId: target.id,
                        email: target.email,
                        isActive: dto.isActive,
                    }),
                    userId: actor.id,
                },
            });
            return updated;
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map