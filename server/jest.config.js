export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    }],
  },
  testMatch: [
    '**/src/test/**/*.test.js',
    '**/src/test/**/*.spec.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/test/**',
    '!src/index.js', // Entry point, covered by integration tests
    '!src/routes/events.js',
    '!src/database/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {},
  testTimeout: 10000,
  verbose: true,
};
