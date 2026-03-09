import type { QueryClient } from "@tanstack/react-query";
import { dashboardQueryKeys } from "./dashboardQueryKeys";

type DashboardQueryKey = ReturnType<
  (typeof dashboardQueryKeys)[keyof typeof dashboardQueryKeys]
>;

export async function invalidateDashboardQueries(
  queryClient: QueryClient,
  keys: readonly DashboardQueryKey[]
) {
  await Promise.all(
    keys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );
}
