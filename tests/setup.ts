/**
 * Jest Test Setup
 * Configures the testing environment for both Node.js and browser tests
 */

// Mock axios for all tests
jest.mock('axios');

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset console methods to avoid interference
  jest.clearAllTimers();
  
  // Ensure clean environment for each test
  delete (global as any).window;
  delete (global as any).document;
  delete (global as any).navigator;
  delete (global as any).localStorage;
  delete (global as any).sessionStorage;
});

afterEach(() => {
  // Clean up any remaining mocks
  jest.restoreAllMocks();
});

// Global test utilities
(global as any).mockConsole = () => {
  const originalConsole = console;
  const mockConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  beforeEach(() => {
    Object.assign(console, mockConsole);
  });
  
  afterEach(() => {
    Object.assign(console, originalConsole);
    jest.clearAllMocks();
  });
  
  return mockConsole;
};

// Global fetch mock for browser environment
Object.defineProperty(globalThis, 'fetch', {
  value: jest.fn(),
  writable: true,
});

// Mock performance.now for consistent timing in tests
Object.defineProperty(globalThis, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

// Mock crypto for Node.js environments that might not have it
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  globalThis.crypto = {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (arr: any) => crypto.getRandomValues(arr),
    subtle: crypto.webcrypto?.subtle,
  };
}

// Helper function to create mock Response objects
export const createMockResponse = (data: any, options: Partial<Response> = {}) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  ...options,
});

// Helper function to create mock browser window
export const createMockWindow = (overrides: any = {}) => ({
  navigator: {
    onLine: true,
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'en-US',
    ...overrides.navigator,
  },
  location: {
    href: 'https://example.com',
    hostname: 'example.com',
    ...overrides.location,
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  ...overrides,
});

// Helper function to setup browser environment
export const setupBrowserEnvironment = (windowOverrides: any = {}) => {
  const mockWindow = createMockWindow(windowOverrides);
  (global as any).window = mockWindow;
  return mockWindow;
};

// Increase test timeout for async operations
jest.setTimeout(30000);