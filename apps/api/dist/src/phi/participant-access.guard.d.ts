import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PhiAccessService } from './phi-access.service';
export declare class ParticipantAccessGuard implements CanActivate {
    private readonly phi;
    constructor(phi: PhiAccessService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
