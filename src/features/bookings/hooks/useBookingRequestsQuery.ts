import { useQuery } from "@tanstack/react-query";
import { listBookingRequests } from "../api/booking-requests.api";

export function useBookingRequestsQuery() {
  return useQuery({
    queryKey: ["booking-requests"],
    queryFn: listBookingRequests,
  });
}
