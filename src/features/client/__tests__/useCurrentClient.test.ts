import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCurrentClient } from "../hooks/useCurrentClient";
import React from "react";

// Mock supabase client
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      onAuthStateChange: (callback: Function) => {
        mockOnAuthStateChange(callback);
        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        };
      },
    },
  },
}));

// Mock getCurrentClient API
vi.mock("../api/client.api", () => ({
  getCurrentClient: vi.fn().mockResolvedValue({
    id: "client-123",
    first_name: "Test",
    last_name: "Client",
  }),
}));

describe("useCurrentClient cache isolation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it("should include userId in queryKey for cache isolation", async () => {
    const testUserId = "user-abc-123";
    mockGetUser.mockResolvedValue({ data: { user: { id: testUserId } } });

    const { result } = renderHook(() => useCurrentClient(), { wrapper });

    await waitFor(() => {
      // Verifica che la queryKey includa l'userId
      const queries = queryClient.getQueryCache().getAll();
      const currentClientQuery = queries.find(
        (q) => q.queryKey[0] === "current-client"
      );
      expect(currentClientQuery?.queryKey).toContain(testUserId);
    });
  });

  it("should disable query when userId is not available", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useCurrentClient(), { wrapper });

    await waitFor(() => {
      // La query non dovrebbe essere abilitata senza userId
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  it("should subscribe to auth state changes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "initial-user" } } });

    renderHook(() => useCurrentClient(), { wrapper });

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });
  });

  it("should unsubscribe on unmount", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "test-user" } } });

    const { unmount } = renderHook(() => useCurrentClient(), { wrapper });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should invalidate cache when user changes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    
    const removeQueriesSpy = vi.spyOn(queryClient, "removeQueries");

    renderHook(() => useCurrentClient(), { wrapper });

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    // Simula cambio utente chiamando il callback registrato
    const authCallback = mockOnAuthStateChange.mock.calls[0][0];
    authCallback("SIGNED_IN", { user: { id: "user-2" } });

    expect(removeQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["current-client"],
    });
  });
});
