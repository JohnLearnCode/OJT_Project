import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '../env' });

// Set test timeout
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// };
