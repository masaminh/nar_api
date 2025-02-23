module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  globalSetup: './jest.globalsetup.js',
  snapshotSerializers: ['<rootDir>/test/snapshot-plugin.ts'],
};
