'use strict';

module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  setupFiles: ['<rootDir>/test/setupEnv.js'],
  testMatch: ['<rootDir>/src/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/__tests__/**',
  ],
};
