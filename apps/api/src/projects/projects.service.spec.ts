import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

function prismaMock() {
  return {
    project: {
      findUnique: jest.fn().mockResolvedValue({ id: 'proj-1' }),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    projectTask: {
      findUnique: jest.fn().mockResolvedValue({ id: 'task-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockImplementation(({ data }) => ({ id: 't', ...data })),
      update: jest
        .fn()
        .mockImplementation(({ data }) => ({ id: 'task-1', ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('ProjectsService tasks', () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ProjectsService);
  });

  it('defaults status and priority on create', async () => {
    await service.createTask({ projectId: 'proj-1', title: ' Task ' });
    expect(prisma.projectTask.create.mock.calls[0][0].data).toMatchObject({
      title: 'Task',
      status: 'PENDING',
      priority: 'MEDIUM',
      assignee: null,
      dueDate: null,
    });
  });

  it('404s for an unknown project instead of a foreign-key error', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(
      service.createTask({ projectId: 'nope', title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // A status flick on the board sends only `status`; it must not blank the rest.
  it('writes only the fields supplied', async () => {
    await service.updateTask('task-1', { status: 'IN_PROGRESS' });
    expect(prisma.projectTask.update.mock.calls[0][0].data).toEqual({
      status: 'IN_PROGRESS',
    });
  });

  it('clears an assignee when explicitly blanked', async () => {
    await service.updateTask('task-1', { assignee: '   ' });
    expect(prisma.projectTask.update.mock.calls[0][0].data).toEqual({
      assignee: null,
    });
  });

  it('404s when updating or deleting an unknown task', async () => {
    prisma.projectTask.findUnique.mockResolvedValue(null);
    await expect(service.updateTask('ghost', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.deleteTask('ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('filters by project and status', async () => {
    await service.listTasks({
      projectId: 'proj-1',
      status: 'COMPLETED',
    });
    expect(prisma.projectTask.findMany.mock.calls[0][0].where).toEqual({
      projectId: 'proj-1',
      status: 'COMPLETED',
    });
  });
});
