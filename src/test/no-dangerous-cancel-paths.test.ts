import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(relativePath), "utf-8");
}

describe("No dangerous cancel paths (anti-regression)", () => {
  it("client-bookings.api should not update session_status=canceled directly", () => {
    const file = readFile("src/features/client-bookings/api/client-bookings.api.ts");
    
    // Should NOT contain direct session_status update
    expect(file).not.toContain("session_status: 'canceled'");
    expect(file).not.toContain('session_status: "canceled"');
  });

  it("client-bookings.api should call cancel_event_with_ledger RPC", () => {
    const file = readFile("src/features/client-bookings/api/client-bookings.api.ts");
    
    // Should contain RPC call for cancel
    expect(file).toContain("cancel_event_with_ledger");
    expect(file).toContain("p_actor: 'client'");
  });

  it("EventEditorModal should not use useDeleteEvent hook", () => {
    const file = readFile("src/features/events/components/EventEditorModal.tsx");
    
    // Should NOT import or use useDeleteEvent
    expect(file).not.toContain("useDeleteEvent");
    expect(file).not.toContain("deleteEvent.mutate");
    expect(file).not.toContain("deleteEvent.mutateAsync");
  });

  it("EventEditorModal should use cancel_event_with_ledger RPC", () => {
    const file = readFile("src/features/events/components/EventEditorModal.tsx");
    
    // Should contain RPC call for cancel
    expect(file).toContain("cancel_event_with_ledger");
    expect(file).toContain("p_actor: 'coach'");
  });

  it("cancelAppointment function should use RPC, not direct update", () => {
    const file = readFile("src/features/client-bookings/api/client-bookings.api.ts");
    
    // Find the cancelAppointment function and verify it uses RPC
    const cancelFnMatch = file.match(/export async function cancelAppointment[\s\S]*?^}/m);
    
    if (cancelFnMatch) {
      const cancelFn = cancelFnMatch[0];
      expect(cancelFn).toContain("supabase.rpc");
      expect(cancelFn).toContain("cancel_event_with_ledger");
      // Should NOT contain direct from().update()
      expect(cancelFn).not.toContain('.from("events")');
      expect(cancelFn).not.toContain(".from('events')");
    }
  });

  it("rejectChangeProposal uses RPC before resetting proposal fields", () => {
    const file = readFile("src/features/client-bookings/api/client-bookings.api.ts");
    
    // Find the rejectChangeProposal function
    const rejectFnMatch = file.match(/export async function rejectChangeProposal[\s\S]*?^}/m);
    
    if (rejectFnMatch) {
      const rejectFn = rejectFnMatch[0];
      // Should call RPC
      expect(rejectFn).toContain("cancel_event_with_ledger");
      // Should have proposal reset (best-effort)
      expect(rejectFn).toContain("proposed_start_at: null");
      expect(rejectFn).toContain("proposed_end_at: null");
      expect(rejectFn).toContain("proposal_status: null");
      // RPC should come before proposal reset (check order by position)
      const rpcPos = rejectFn.indexOf("cancel_event_with_ledger");
      const resetPos = rejectFn.indexOf("proposed_start_at: null");
      expect(rpcPos).toBeLessThan(resetPos);
    }
  });

  it("useDeleteEvent should use cancel_event_with_ledger RPC, not deleteEvent", () => {
    const file = readFile("src/features/events/hooks/useDeleteEvent.ts");
    
    // Should use RPC
    expect(file).toContain("cancel_event_with_ledger");
    expect(file).toContain("p_actor: 'coach'");
    
    // Should NOT call deleteEvent (direct DELETE)
    expect(file).not.toContain("deleteEvent(");
    
    // Should invalidate package queries
    expect(file).toContain('"packages"');
    expect(file).toContain('"package-ledger"');
  });
});
