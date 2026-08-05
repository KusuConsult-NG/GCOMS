import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
export declare const userSelect: {
    readonly id: true;
    readonly email: true;
    readonly firstName: true;
    readonly lastName: true;
    readonly role: true;
    readonly isActive: true;
    readonly createdAt: true;
    readonly password: false;
};
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(role?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    findOne(email: string): Promise<User | null>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    } | null>;
    createUser(dto: CreateUserDto, actorRole: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    updateRole(id: string, dto: UpdateUserRoleDto, actor: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    } | null>;
    updateStatus(id: string, dto: UpdateUserStatusDto, actor: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    } | null>;
}
