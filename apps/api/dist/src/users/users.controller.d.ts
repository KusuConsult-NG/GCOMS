import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUsers(role?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    }[]>;
}
