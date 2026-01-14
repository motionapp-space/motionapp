import { describe, it, expect, vi, beforeEach } from "vitest";
import { cancelAppointment } from "../client-bookings.api";

// Mock supabase
const rpcMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

// Mock getClientCoachClientId (not needed for cancelAppointment but avoid import errors)
vi.mock("@/lib/coach-client", () => ({
  getClientCoachClientId: vi.fn(),
}));

describe("cancelAppointment()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls cancel_event_with_ledger with actor=client", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { event_id: "e1", canceled: true, ledger_action: "release", is_late: false },
      error: null,
    });

    const res = await cancelAppointment("e1");

    expect(rpcMock).toHaveBeenCalledWith("cancel_event_with_ledger", {
      p_event_id: "e1",
      p_actor: "client",
    });
    expect(res).toMatchObject({ event_id: "e1", canceled: true, ledger_action: "release" });
  });

  it("throws on supabase error", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });

    await expect(cancelAppointment("e1")).rejects.toThrow("boom");
  });

  it("throws on data.error", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { error: "RPC error" },
      error: null,
    });

    await expect(cancelAppointment("e1")).rejects.toThrow("RPC error");
  });

  it("returns result with already_canceled flag", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { event_id: "e1", already_canceled: true },
      error: null,
    });

    const res = await cancelAppointment("e1");
    expect(res?.already_canceled).toBe(true);
  });
});
