import { Test } from '@nestjs/testing';
import { AnalysisService } from '../../src/analysis/analysis.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('AnalysisService', () => {
  it('maps groups and items', async () => {
    const prismaMock = {
      analysisGroup: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: '站姿與平衡',
            sportType: 'snowboard',
            description: 'desc',
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      },
      analysisItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 100,
            groupId: 1,
            name: '重心在前腳',
            nameEn: null,
            description: null,
            sportType: 'snowboard',
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [AnalysisService, { provide: PrismaService, useValue: prismaMock }]
    }).compile();

    const service = module.get(AnalysisService);
    const groups = await service.listGroups();

    expect(groups).toEqual([
      {
        id: 1,
        name: '站姿與平衡',
        sportType: 'snowboard',
        description: 'desc',
        displayOrder: 1,
        items: [
          {
            id: 100,
            groupId: 1,
            name: '重心在前腳',
            description: null,
            sportType: 'snowboard',
            displayOrder: 1
          }
        ]
      }
    ]);
  });
});
