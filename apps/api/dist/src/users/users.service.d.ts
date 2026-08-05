import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
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
    create(data: Prisma.UserCreateInput): Promise<User>;
}
