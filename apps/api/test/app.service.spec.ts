import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../src/app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService]
    }).compile();

    service = module.get(AppService);
  });

  it('returns ok status', () => {
    expect(service.healthCheck().status).toBe('ok');
  });
});
