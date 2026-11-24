import type { Config } from 'jest';
import nextJest from 'next/jest.js';

// next/jest loads next.config + .env files and wires up SWC transforms,
// so tests compile exactly like the app does.
const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Jest doesn't resolve the "react-server" export condition, so the marker
    // package would throw on import; tests use its no-op build instead.
    '^server-only$': '<rootDir>/node_modules/server-only/empty.js',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/test/**'],
  clearMocks: true,
};

export default createJestConfig(config);
