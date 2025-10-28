import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Testing Prisma connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');

    const result = await prisma.$queryRaw`SELECT current_database(), current_user`;
    console.log('Query result:', result);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

main();
