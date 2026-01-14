import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHookWithQC } from "@/test/utils/renderHookWithQueryClient";
import { useRespondToChangeProposal } from "../useRespondToChangeProposal";
import { toast } from "sonner";
import { waitFor } from "@testing-library/react";

// Mock the API functions
const rejectChangeProposalMock = vi.fn();
const acceptChangeProposalMock = vi.fn();

vi.mock("../api/client-bookings.api", () => ({
  rejectChangeProposal: (eventId: string) => rejectChangeProposalMock(eventId),
  acceptChangeProposal: (eventId: string) => acceptChangeProposalMock(eventId),
}));

// Note: useClientAuth is not used by this hook

describe("useRespondToChangeProposal - reject mutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows success toast for release", async () => {
    rejectChangeProposalMock.mockResolvedValueOnce({
      event_id: "e1",
      canceled: true,
      ledger_action: "release",
      is_late: false,
    });

    const { result, queryClient } = renderHookWithQC(() => useRespondToChangeProposal());
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    result.current.reject("e1");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(toast.success).toHaveBeenCalledWith("Proposta rifiutata", {
      description: "Credito restituito al pacchetto",
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["client-appointments-view"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["client-appointments"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["packages"], exact: false });
  });

  it("shows warning toast for late consume", async () => {
    rejectChangeProposalMock.mockResolvedValueOnce({
      event_id: "e1",
      canceled: true,
      ledger_action: "consume",
      is_late: true,
    });

    const { result } = renderHookWithQC(() => useRespondToChangeProposal());
    result.current.reject("e1");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(toast.warning).toHaveBeenCalledWith("Proposta rifiutata", {
      description: "1 credito consumato per cancellazione tardiva",
    });
  });

  it("shows info toast for already_canceled", async () => {
    rejectChangeProposalMock.mockResolvedValueOnce({
      event_id: "e1",
      already_canceled: true,
    });

    const { result } = renderHookWithQC(() => useRespondToChangeProposal());
    result.current.reject("e1");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(toast.info).toHaveBeenCalledWith("Appuntamento già annullato");
  });

  it("shows generic success toast when no specific ledger_action", async () => {
    rejectChangeProposalMock.mockResolvedValueOnce({
      event_id: "e1",
      canceled: true,
      economic_type: "single_paid",
    });

    const { result } = renderHookWithQC(() => useRespondToChangeProposal());
    result.current.reject("e1");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(toast.success).toHaveBeenCalledWith("Proposta rifiutata", {
      description: "L'appuntamento è stato annullato",
    });
  });

  it("shows error toast on failure", async () => {
    rejectChangeProposalMock.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHookWithQC(() => useRespondToChangeProposal());
    result.current.reject("e1");

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith("Errore", {
      description: "network error",
    });
  });
});
