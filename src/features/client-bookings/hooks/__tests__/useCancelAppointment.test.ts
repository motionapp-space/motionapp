import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithQC } from "@/test/utils/renderHookWithQueryClient";
import { useCancelAppointment } from "../useCancelAppointment";
import { toast } from "sonner";
import { waitFor } from "@testing-library/react";

// Mock the API function
const cancelAppointmentMock = vi.fn();
vi.mock("../api/client-bookings.api", () => ({
  cancelAppointment: (eventId: string) => cancelAppointmentMock(eventId),
}));

describe("useCancelAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows success toast for release and invalidates queries", async () => {
    cancelAppointmentMock.mockResolvedValueOnce({
      event_id: "e1",
      canceled: true,
      ledger_action: "release",
      is_late: false,
    });

    const { result, queryClient } = renderHookWithQC(() => useCancelAppointment());
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    result.current.mutate("e1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Appuntamento annullato", {
      description: "Credito restituito al pacchetto",
    });
    expect(toast.warning).not.toHaveBeenCalled();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["client-appointments-view"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["client-appointments"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["packages"], exact: false });
  });

  it("shows warning toast for late consume", async () => {
    cancelAppointmentMock.mockResolvedValueOnce({
      event_id: "e1",
      canceled: true,
      ledger_action: "consume",
      is_late: true,
    });

    const { result } = renderHookWithQC(() => useCancelAppointment());
    result.current.mutate("e1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.warning).toHaveBeenCalledWith("Cancellazione tardiva", {
      description: "1 credito consumato per cancellazione entro finestra",
    });
  });

  it("shows info toast for already_canceled", async () => {
    cancelAppointmentMock.mockResolvedValueOnce({
      event_id: "e1",
      already_canceled: true,
    });

    const { result } = renderHookWithQC(() => useCancelAppointment());
    result.current.mutate("e1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.info).toHaveBeenCalledWith("Appuntamento già annullato");
  });

  it("shows generic success toast when no specific ledger_action", async () => {
    cancelAppointmentMock.mockResolvedValueOnce({
      event_id: "e1",
      canceled: true,
      economic_type: "free",
    });

    const { result } = renderHookWithQC(() => useCancelAppointment());
    result.current.mutate("e1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Appuntamento annullato");
  });

  it("shows error toast on failure", async () => {
    cancelAppointmentMock.mockRejectedValueOnce(new Error("rpc down"));

    const { result } = renderHookWithQC(() => useCancelAppointment());
    result.current.mutate("e1");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Errore", {
      description: "rpc down",
    });
  });
});
