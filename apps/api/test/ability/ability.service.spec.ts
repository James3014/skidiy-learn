import { Test } from '@nestjs/testing';
import { AbilityService } from '../../src/ability/ability.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('AbilityService', () => {
  it('returns mapped abilities', async () => {
    const prismaMock = {
      abilityCatalog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: '能力A',
            category: 'cat',
            sportType: 'snowboard',
            skillLevel: 2,
            sequenceInLevel: 3,
            description: 'desc',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [AbilityService, { provide: PrismaService, useValue: prismaMock }]
    }).compile();

    const service = module.get(AbilityService);
    const result = await service.listAbilities();
    expect(result).toEqual([
      {
        id: 1,
        name: '能力A',
        category: 'cat',
        sportType: 'snowboard',
        skillLevel: 2,
        sequenceInLevel: 3,
        description: 'desc'
      }
    ]);
  });
});
