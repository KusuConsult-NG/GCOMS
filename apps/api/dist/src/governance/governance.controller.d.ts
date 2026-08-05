import { GovernanceService } from './governance.service';
import { CreateGovernanceMeetingDto } from './dto/create-governance-meeting.dto';
export declare class GovernanceController {
    private readonly governanceService;
    constructor(governanceService: GovernanceService);
    scheduleMeeting(data: CreateGovernanceMeetingDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        meetingDate: Date;
        minutesUrl: string | null;
        organizedById: string;
    }>;
    getMeetings(): Promise<({
        organizedBy: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        meetingDate: Date;
        minutesUrl: string | null;
        organizedById: string;
    })[]>;
}
