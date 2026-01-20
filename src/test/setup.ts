import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Global mock for sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock ResizeObserver with takeRecords for full API coverage
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Deterministic RAF mock using queueMicrotask (with fallback guard)
const qm = globalThis.queueMicrotask ?? ((cb: () => void) => Promise.resolve().then(cb));

global.requestAnimationFrame = vi.fn((cb) => {
  qm(() => cb(performance.now()));
  return 1;
});
global.cancelAnimationFrame = vi.fn();

// NO global getBoundingClientRect mock - mock locally in tests that need it
