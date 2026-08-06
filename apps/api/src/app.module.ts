import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';
import {
  loginAccountTracker,
  loginSourceTracker,
  requestTracker,
} from './common/throttling';

/**
 * Login limits. Per-account is the tight one: it is what stops an account being
 * guessed at, from anywhere. Per-source is looser and catches spraying across
 * many accounts from one address.
 */
const LOGIN_ACCOUNT_LIMIT = Number(process.env.LOGIN_RATE_LIMIT ?? 5);
const LOGIN_SOURCE_LIMIT = Number(process.env.LOGIN_SOURCE_RATE_LIMIT ?? 30);
const LOGIN_TTL_MS = Number(process.env.LOGIN_RATE_TTL_MS ?? 60_000);

/** Matched on the handler, not the URL, so a route rename cannot silently unbind it. */
function isLoginRequest(context: ExecutionContext): boolean {
  return (
    context.getClass?.()?.name === 'AuthController' &&
    context.getHandler?.()?.name === 'login'
  );
}
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { PhiModule } from './phi/phi.module';
import { HealthModule } from './health/health.module';
import { OperationsModule } from './operations/operations.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ParticipantsModule } from './participants/participants.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ScreeningsModule } from './screenings/screenings.module';
import { ClinicalEncountersModule } from './clinical-encounters/clinical-encounters.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { FinanceModule } from './finance/finance.module';
import { ProcurementModule } from './procurement/procurement.module';
import { HrModule } from './hr/hr.module';
import { AdminModule } from './admin/admin.module';
import { GrantsModule } from './grants/grants.module';
import { ProjectsModule } from './projects/projects.module';
import { InventoryModule } from './inventory/inventory.module';
import { DocumentsModule } from './documents/documents.module';
import { GovernanceModule } from './governance/governance.module';
import { SystemAdminModule } from './system-admin/system-admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StrategyModule } from './strategy/strategy.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OutreachModule } from './outreach/outreach.module';
import { NavigationModule } from './navigation/navigation.module';
import { ResearchModule } from './research/research.module';
import { ReferralsModule } from './referrals/referrals.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { CommunitiesModule } from './communities/communities.module';
import { ReportsModule } from './reports/reports.module';
import { FollowUpModule } from './follow-up/follow-up.module';
import { LocationsModule } from './locations/locations.module';
import { VitalsModule } from './vitals/vitals.module';
import { MedicalHistoryModule } from './medical-history/medical-history.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // Loads .env explicitly. Previously env vars only appeared as a side effect of
    // Prisma Client's own .env loading, which meant JWT_SECRET could silently be
    // undefined depending on import order.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    // Three buckets. `default` covers all traffic; the two login buckets apply
    // only to AuthController.login (see their skipIf) and limit an account and a
    // source address independently, so a guessing storm against one account
    // cannot lock out everyone else.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
        getTracker: (req) => requestTracker(req),
      },
      {
        name: 'login-account',
        ttl: LOGIN_TTL_MS,
        limit: LOGIN_ACCOUNT_LIMIT,
        getTracker: (req) => loginAccountTracker(req),
        skipIf: (context) => !isLoginRequest(context),
      },
      {
        name: 'login-source',
        ttl: LOGIN_TTL_MS,
        limit: LOGIN_SOURCE_LIMIT,
        getTracker: (req) => loginSourceTracker(req),
        skipIf: (context) => !isLoginRequest(context),
      },
    ]),
    PrismaModule,
    PhiModule,
    HealthModule,
    OperationsModule,
    UsersModule,
    AuthModule,
    ParticipantsModule,
    DashboardModule,
    ScreeningsModule,
    ClinicalEncountersModule,
    ApprovalsModule,
    FinanceModule,
    ProcurementModule,
    HrModule,
    AdminModule,
    GrantsModule,
    ProjectsModule,
    InventoryModule,
    DocumentsModule,
    GovernanceModule,
    SystemAdminModule,
    AnalyticsModule,
    StrategyModule,
    NotificationsModule,
    OutreachModule,
    NavigationModule,
    ResearchModule,
    ReferralsModule,
    VolunteersModule,
    CommunitiesModule,
    ReportsModule,
    FollowUpModule,
    LocationsModule,
    VitalsModule,
    MedicalHistoryModule,
    AppointmentsModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
