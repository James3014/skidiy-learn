import { PrismaClient, SportType } from '@prisma/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../../..');

function resolveSportType(code: string | undefined): SportType {
  return (code ?? '').toLowerCase() === 'sb' ? 'snowboard' : 'ski';
}

async function seedAbilityCatalog() {
  const filePath = path.join(ROOT_DIR, 'abilitylist.csv');
  const csv = readFileSync(filePath, 'utf-8');
  const records: Array<Record<string, string>> = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  let inserted = 0;

  for (const row of records) {
    const id = Number(row.idx);
    if (!Number.isFinite(id) || id <= 0) continue;
    const name = row.item?.trim();
    if (!name) continue;

    await prisma.abilityCatalog.upsert({
      where: { id },
      create: {
        id,
        name,
        category: row.type?.trim() || 'ability',
        sportType: resolveSportType(row.type),
        skillLevel: Number(row.level) || 0,
        sequenceInLevel: Number(row.number) || id,
        description: row.explanation?.trim() || null
      },
      update: {
        name,
        category: row.type?.trim() || 'ability',
        sportType: resolveSportType(row.type),
        skillLevel: Number(row.level) || 0,
        sequenceInLevel: Number(row.number) || id,
        description: row.explanation?.trim() || null,
        updatedAt: new Date()
      }
    });

    inserted += 1;
  }

  console.log(`Seeded ability_catalog with ${inserted} rows`);
}

async function seedAnalysisCatalog() {
  const filePath = path.join(ROOT_DIR, '教學紀錄_200925.csv');
  const csvContent = readFileSync(filePath, 'utf-8');

  // Split by lines and only take the analysis section (before student mapping section)
  const lines = csvContent.split('\n');
  const analysisLines = [];
  for (const line of lines) {
    // Stop when we hit the student mapping header
    if (line.includes('orderNo') && line.includes('mappingOrder')) break;
    analysisLines.push(line);
  }

  const csv = analysisLines.join('\n');
  const records: Array<Record<string, string>> = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  let inserted = 0;

  for (const row of records) {
    // Skip rows that don't have 'category' column (e.g., student mapping section)
    if (!row.category || row.category === 'orderNo') continue;

    const idx = Number(row.idx);
    if (!Number.isFinite(idx) || idx <= 0) continue;
    const category = row.category?.trim();
    const analysis = row.analysis?.trim();
    if (!category || !analysis) continue;
    const sportType = resolveSportType(row.type);
    const description = row.description?.trim() || null;

    const group = await prisma.analysisGroup.upsert({
      where: { name_sportType: { name: category, sportType } },
      create: {
        name: category,
        sportType,
        description,
        displayOrder: idx
      },
      update: {
        description,
        displayOrder: idx,
        updatedAt: new Date()
      }
    });

    await prisma.analysisItem.upsert({
      where: { id: idx },
      create: {
        id: idx,
        groupId: group.id,
        name: analysis,
        nameEn: null,
        description,
        sportType,
        displayOrder: idx
      },
      update: {
        groupId: group.id,
        name: analysis,
        description,
        sportType,
        displayOrder: idx,
        updatedAt: new Date()
      }
    });

    inserted += 1;
  }

  console.log(`Seeded analysis catalog with ${inserted} rows`);
}

async function main() {
  await seedAbilityCatalog();
  await seedAnalysisCatalog();
}

main()
  .then(() => {
    console.log('Database seed completed');
  })
  .catch((error) => {
    console.error('Database seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
