module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['./node_modules', 'jest.config.js', 'jest.globalsetup.js'],
  globalSetup: './jest.globalsetup.js',
  snapshotSerializers: ['<rootDir>/test/snapshot-plugin.ts'],
}
