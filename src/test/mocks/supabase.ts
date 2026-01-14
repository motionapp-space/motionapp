import { vi } from "vitest";

// Mock for supabase.rpc
export const rpcMock = vi.fn();

// Mock for supabase.from().update().eq()
export const eqMock = vi.fn();
export const updateMock = vi.fn(() => ({ eq: eqMock }));
export const fromMock = vi.fn(() => ({ update: updateMock }));

export const supabaseMock = {
  rpc: rpcMock,
  from: fromMock,
};

// Reset all mocks helper
export const resetSupabaseMocks = () => {
  rpcMock.mockReset();
  eqMock.mockReset();
  updateMock.mockReset();
  fromMock.mockReset();
};
