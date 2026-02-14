import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';

// initialize environment variables for testing
process.env.DATABASE_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '3002'; // Use different port for tests

// Mock console.log/error to keep test output clean
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
