import type { Role } from '../../auth/roles.constants';
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
}
