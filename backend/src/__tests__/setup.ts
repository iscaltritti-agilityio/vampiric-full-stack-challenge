import sqlite3 from 'sqlite3';

// Global test setup
beforeEach(() => {
  // Reset console warnings/errors for clean test output
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any test artifacts
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

