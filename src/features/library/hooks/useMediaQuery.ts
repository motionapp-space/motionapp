import { useQuery } from "@tanstack/react-query";
import { getMedia } from "../api/media.api";
import type { MediaFilters } from "../types";

export function useMediaQuery(filters?: MediaFilters) {
  return useQuery({
    queryKey: ["library-media", filters],
    queryFn: () => getMedia(filters),
  });
}
