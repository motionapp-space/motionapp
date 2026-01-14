import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, RenderHookResult } from "@testing-library/react";

export function renderHookWithQC<TResult, TProps>(
  useHook: (props: TProps) => TResult,
  initialProps?: TProps
): RenderHookResult<TResult, TProps> & { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const rendered = renderHook(useHook, { wrapper, initialProps });
  return { ...rendered, queryClient };
}
