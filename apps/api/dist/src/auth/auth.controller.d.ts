import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(_dto: LoginDto, req: any): Promise<{
        access_token: string;
        user: any;
    }>;
    getProfile(req: any): any;
}
