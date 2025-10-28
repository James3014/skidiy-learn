import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class IntegrationTestEnvironment {
  private static instance: IntegrationTestEnvironment;
  private postgresContainer: StartedPostgreSqlContainer | null = null;
  public app: INestApplication | null = null;
  public prisma: PrismaClient | null = null;
  public databaseUrl: string = '';

  private constructor() {}

  static getInstance(): IntegrationTestEnvironment {
    if (!IntegrationTestEnvironment.instance) {
      IntegrationTestEnvironment.instance = new IntegrationTestEnvironment();
    }
    return IntegrationTestEnvironment.instance;
  }

  async setup(): Promise<void> {
    console.log('🚀 啟動 PostgreSQL 測試容器...');

    // 啟動 PostgreSQL 容器
    this.postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withExposedPorts(5432)
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    this.databaseUrl = this.postgresContainer.getConnectionUri();
    process.env.DATABASE_URL = this.databaseUrl;

    console.log(`✅ PostgreSQL 容器已啟動: ${this.databaseUrl}`);

    // 執行 Prisma 遷移
    console.log('📦 執行資料庫遷移...');
    await execAsync('pnpm prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: this.databaseUrl }
    });

    console.log('✅ 資料庫遷移完成');

    // 建立 Prisma Client
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl
        }
      }
    });

    await this.prisma.$connect();
    console.log('✅ Prisma Client 已連接');

    // 建立 NestJS 應用
    console.log('🏗️  建立 NestJS 測試應用...');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();

    console.log('✅ 整合測試環境準備完成');
  }

  async teardown(): Promise<void> {
    console.log('🧹 清理測試環境...');

    if (this.app) {
      await this.app.close();
      console.log('✅ NestJS 應用已關閉');
    }

    if (this.prisma) {
      await this.prisma.$disconnect();
      console.log('✅ Prisma Client 已斷開');
    }

    if (this.postgresContainer) {
      await this.postgresContainer.stop();
      console.log('✅ PostgreSQL 容器已停止');
    }
  }

  async cleanDatabase(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized');
    }

    // 清空所有資料表（保持遷移）
    const tablenames = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname='public'
      AND tablename != '_prisma_migrations'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          console.log(`Warning: Could not truncate ${tablename}:`, error);
        }
      }
    }
  }
}
