import { Test, TestingModule } from '@nestjs/testing';
import { VolunteersController } from './volunteers.controller';

describe('VolunteersController', () => {
  let controller: VolunteersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VolunteersController],
    }).compile();

    controller = module.get<VolunteersController>(VolunteersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
