import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalEncountersService } from './clinical-encounters.service';

describe('ClinicalEncountersService', () => {
  let service: ClinicalEncountersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicalEncountersService],
    }).compile();

    service = module.get<ClinicalEncountersService>(ClinicalEncountersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
