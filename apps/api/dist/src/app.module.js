"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const participants_module_1 = require("./participants/participants.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const screenings_module_1 = require("./screenings/screenings.module");
const clinical_encounters_module_1 = require("./clinical-encounters/clinical-encounters.module");
const approvals_module_1 = require("./approvals/approvals.module");
const finance_module_1 = require("./finance/finance.module");
const procurement_module_1 = require("./procurement/procurement.module");
const hr_module_1 = require("./hr/hr.module");
const admin_module_1 = require("./admin/admin.module");
const grants_module_1 = require("./grants/grants.module");
const projects_module_1 = require("./projects/projects.module");
const inventory_module_1 = require("./inventory/inventory.module");
const documents_module_1 = require("./documents/documents.module");
const governance_module_1 = require("./governance/governance.module");
const system_admin_module_1 = require("./system-admin/system-admin.module");
const analytics_module_1 = require("./analytics/analytics.module");
const strategy_module_1 = require("./strategy/strategy.module");
const notifications_module_1 = require("./notifications/notifications.module");
const outreach_module_1 = require("./outreach/outreach.module");
const navigation_module_1 = require("./navigation/navigation.module");
const research_module_1 = require("./research/research.module");
const referrals_module_1 = require("./referrals/referrals.module");
const volunteers_module_1 = require("./volunteers/volunteers.module");
const communities_module_1 = require("./communities/communities.module");
const reports_module_1 = require("./reports/reports.module");
const follow_up_module_1 = require("./follow-up/follow-up.module");
const locations_module_1 = require("./locations/locations.module");
const vitals_module_1 = require("./vitals/vitals.module");
const medical_history_module_1 = require("./medical-history/medical-history.module");
const appointments_module_1 = require("./appointments/appointments.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            participants_module_1.ParticipantsModule,
            dashboard_module_1.DashboardModule,
            screenings_module_1.ScreeningsModule,
            clinical_encounters_module_1.ClinicalEncountersModule,
            approvals_module_1.ApprovalsModule,
            finance_module_1.FinanceModule,
            procurement_module_1.ProcurementModule,
            hr_module_1.HrModule,
            admin_module_1.AdminModule,
            grants_module_1.GrantsModule,
            projects_module_1.ProjectsModule,
            inventory_module_1.InventoryModule,
            documents_module_1.DocumentsModule,
            governance_module_1.GovernanceModule,
            system_admin_module_1.SystemAdminModule,
            analytics_module_1.AnalyticsModule,
            strategy_module_1.StrategyModule,
            notifications_module_1.NotificationsModule,
            outreach_module_1.OutreachModule,
            navigation_module_1.NavigationModule,
            research_module_1.ResearchModule,
            referrals_module_1.ReferralsModule,
            volunteers_module_1.VolunteersModule,
            communities_module_1.CommunitiesModule,
            reports_module_1.ReportsModule,
            follow_up_module_1.FollowUpModule,
            locations_module_1.LocationsModule,
            vitals_module_1.VitalsModule,
            medical_history_module_1.MedicalHistoryModule,
            appointments_module_1.AppointmentsModule,
            scheduler_module_1.SchedulerModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map