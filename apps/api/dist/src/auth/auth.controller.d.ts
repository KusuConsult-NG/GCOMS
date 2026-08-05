import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(body: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(req: any): any;
}
