import { Test } from '@nestjs/testing';
import { PracticeService } from '../../src/practice/practice.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('PracticeService', () => {
  it('maps skills with drills', async () => {
    const prismaMock = {
      skill: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 10,
            name: '核心轉換',
            nameEn: null,
            sportType: 'ski',
            description: null,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      },
      practiceDrill: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 200,
            skillId: 10,
            name: '八字滑行',
            nameEn: null,
            description: '描述',
            sportType: 'ski',
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [PracticeService, { provide: PrismaService, useValue: prismaMock }]
    }).compile();

    const service = module.get(PracticeService);
    const result = await service.listSkills();

    expect(result).toEqual([
      {
        id: 10,
        name: '核心轉換',
        nameEn: null,
        sportType: 'ski',
        description: null,
        displayOrder: 1,
        drills: [
          {
            id: 200,
            skillId: 10,
            name: '八字滑行',
            nameEn: null,
            description: '描述',
            sportType: 'ski',
            displayOrder: 1
          }
        ]
      }
    ]);
  });
});
