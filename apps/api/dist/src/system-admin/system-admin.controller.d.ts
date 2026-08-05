import { SystemAdminService } from './system-admin.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
export declare class SystemAdminController {
    private readonly systemAdminService;
    constructor(systemAdminService: SystemAdminService);
    setConfig(data: UpdateSystemConfigDto, req: any): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }>;
    getConfigs(req: any): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }[]>;
}
