import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Performance: evita refetch non richiesti
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Performance/UX: caching ragionevole
      staleTime: 30_000,    // 30s default
      gcTime: 10 * 60_000,  // 10 min garbage collection

      // Stabilità: evita tempeste di retry
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    },
    mutations: {
      retry: 0,
    },
  },
});
