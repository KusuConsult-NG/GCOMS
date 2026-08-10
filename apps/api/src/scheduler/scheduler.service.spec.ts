import { Test } from '@nestjs/testing';
import { BackgroundSchedulerService } from './scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * The scheduler must not claim a patient was contacted.
 *
 * It used to write the NotificationItem itself, with status 'SENT', on the SMS
 * channel — for which this deployment has no gateway. Nothing was sent, nothing
 * was attempted, and the record said the patient had been told they missed a
 * follow-up. NotificationsService exists precisely to avoid that: it records
 * PENDING and only moves a message to SENT once a transport has accepted it.
 *
 * A mock is the right tool here, unusually. What is being asserted is which
 * collaborator gets called — that the scheduler goes through the service rather
 * than around it — and a real database would show the resulting row without
 * showing how it got there.
 */
describe('BackgroundSchedulerService', () => {
  const overdue = {
    id: 'fu-1',
    participantId: 'p-1',
    participant: { firstName: 'Amina', phoneNumber: '+2348031234567' },
  };

  const build = async (followUps: unknown[]) => {
    const prisma = {
      followUp: {
        findMany: jest.fn().mockResolvedValue(followUps),
        update: jest.fn().mockResolvedValue({}),
      },
      appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
      notificationItem: { create: jest.fn().mockResolvedValue({}) },
    };
    const notifications = {
      sendSms: jest.fn().mockResolvedValue({}),
      sendEmail: jest.fn().mockResolvedValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BackgroundSchedulerService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    return {
      service: moduleRef.get(BackgroundSchedulerService),
      prisma,
      notifications,
    };
  };

  it('marks an overdue follow-up as missed', async () => {
    const { service, prisma } = await build([overdue]);
    await service.runSchedulerChecks();
    expect(prisma.followUp.update).toHaveBeenCalledWith({
      where: { id: 'fu-1' },
      data: { status: 'MISSED' },
    });
  });

  it('sends the alert through NotificationsService', async () => {
    const { service, notifications } = await build([overdue]);
    await service.runSchedulerChecks();
    expect(notifications.sendSms).toHaveBeenCalledWith(
      '+2348031234567',
      expect.stringContaining('missed your scheduled follow-up'),
    );
  });

  it('never writes a notification row itself, which is how it claimed SENT', async () => {
    const { service, prisma } = await build([overdue]);
    await service.runSchedulerChecks();
    // The regression this file exists for. Writing the row directly is what
    // allowed a status the transport had never agreed to.
    expect(prisma.notificationItem.create).not.toHaveBeenCalled();
  });

  it('does not attempt an SMS to a patient with no phone number', async () => {
    const { service, notifications, prisma } = await build([
      { ...overdue, participant: { firstName: 'Amina', phoneNumber: null } },
    ]);
    await service.runSchedulerChecks();
    // The follow-up is still marked missed — the record is about the patient,
    // not about whether we could reach them.
    expect(prisma.followUp.update).toHaveBeenCalled();
    expect(notifications.sendSms).not.toHaveBeenCalled();
  });

  it('does nothing when nothing is overdue', async () => {
    const { service, notifications, prisma } = await build([]);
    await service.runSchedulerChecks();
    expect(prisma.followUp.update).not.toHaveBeenCalled();
    expect(notifications.sendSms).not.toHaveBeenCalled();
  });

  it('survives a failure without taking the process down', async () => {
    const { service, prisma } = await build([overdue]);
    prisma.followUp.findMany.mockRejectedValueOnce(new Error('database gone'));
    // It runs on an interval from onModuleInit; an unhandled rejection here
    // would be an unhandled rejection in the application.
    await expect(service.runSchedulerChecks()).resolves.toBeUndefined();
  });
});
