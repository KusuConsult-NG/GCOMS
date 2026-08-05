import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalEncountersController } from './clinical-encounters.controller';

describe('ClinicalEncountersController', () => {
  let controller: ClinicalEncountersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalEncountersController],
    }).compile();

    controller = module.get<ClinicalEncountersController>(ClinicalEncountersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
