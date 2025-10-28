import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.integration\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  moduleNameMapper: {
    '^(.*)\\.js$': '$1'
  },
  testEnvironment: 'node',
  testTimeout: 120000, // 2 分鐘超時（容器啟動需要時間）
  maxWorkers: 1, // 序列執行整合測試（避免容器衝突）
  forceExit: true // 強制退出（確保容器清理）
};

export default config;
