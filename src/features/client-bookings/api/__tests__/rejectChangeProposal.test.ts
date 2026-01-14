import { describe, it, expect, vi, beforeEach } from "vitest";
import { rejectChangeProposal } from "../client-bookings.api";

// Mock supabase
const rpcMock = vi.fn();
const eqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ update: updateMock }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

// Mock getClientCoachClientId
vi.mock("@/lib/coach-client", () => ({
  getClientCoachClientId: vi.fn(),
}));

describe("rejectChangeProposal()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset from mock chain
    fromMock.mockReturnValue({ update: updateMock });
    updateMock.mockReturnValue({ eq: eqMock });
    eqMock.mockResolvedValue({ error: null });
  });

  it("calls cancel RPC (actor=client) then resets proposal fields", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { event_id: "e1", canceled: true, ledger_action: "release" },
      error: null,
    });

    const res = await rejectChangeProposal("e1");

    // Verify RPC call
    expect(rpcMock).toHaveBeenCalledWith("cancel_event_with_ledger", {
      p_event_id: "e1",
      p_actor: "client",
    });

    // Verify proposal fields reset
    expect(fromMock).toHaveBeenCalledWith("events");
    expect(updateMock).toHaveBeenCalledWith({
      proposed_start_at: null,
      proposed_end_at: null,
      proposal_status: null,
    });
    expect(eqMock).toHaveBeenCalledWith("id", "e1");

    expect(res).toMatchObject({ canceled: true, ledger_action: "release" });
  });

  it("does not block if proposal reset fails (best-effort)", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { event_id: "e1", canceled: true, ledger_action: "release" },
      error: null,
    });
    // Simulate failing update
    eqMock.mockRejectedValueOnce(new Error("update failed"));

    // Should not throw
    const res = await rejectChangeProposal("e1");
    expect(res).toMatchObject({ canceled: true });
  });

  it("throws if cancel RPC fails", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "rpc down" },
    });

    await expect(rejectChangeProposal("e1")).rejects.toThrow("rpc down");
  });

  it("throws if RPC returns data.error", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { error: "Event already completed" },
      error: null,
    });

    await expect(rejectChangeProposal("e1")).rejects.toThrow("Event already completed");
  });
});
