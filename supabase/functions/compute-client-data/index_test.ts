import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapRpcRowToComputedData } from "./index.ts";

Deno.test("mapRpcRowToComputedData - maps has_active_plan correctly", () => {
  const rpcRow = {
    client_id: "uuid-1",
    plan_weeks_since_assignment: 5,
    package_status: "active",
    appointment_status: "planned",
    activity_status: "active",
    next_appointment_date: null,
    has_active_plan: true,
  };

  const result = mapRpcRowToComputedData(rpcRow);

  assertEquals(result.has_active_plan, true);
  assertExists(result.client_id);
});

Deno.test("mapRpcRowToComputedData - defaults has_active_plan to false when missing", () => {
  const rpcRowMissingField = {
    client_id: "uuid-2",
    plan_weeks_since_assignment: null,
    package_status: "none",
    appointment_status: "unplanned",
    activity_status: "inactive",
    next_appointment_date: null,
    has_active_plan: undefined as any,
  };

  const result = mapRpcRowToComputedData(rpcRowMissingField);

  assertEquals(result.has_active_plan, false);
});

Deno.test("mapRpcRowToComputedData - preserves all existing fields", () => {
  const rpcRow = {
    client_id: "uuid-3",
    plan_weeks_since_assignment: 3,
    package_status: "low",
    appointment_status: "unplanned",
    activity_status: "low",
    next_appointment_date: "2024-12-01T10:00:00Z",
    has_active_plan: false,
  };

  const result = mapRpcRowToComputedData(rpcRow);

  assertEquals(result.client_id, "uuid-3");
  assertEquals(result.plan_weeks_since_assignment, 3);
  assertEquals(result.package_status, "low");
  assertEquals(result.appointment_status, "unplanned");
  assertEquals(result.activity_status, "low");
  assertEquals(result.next_appointment_date, "2024-12-01T10:00:00Z");
  assertEquals(result.has_active_plan, false);
});

Deno.test("mapRpcRowToComputedData - handles null plan_weeks", () => {
  const rpcRow = {
    client_id: "uuid-4",
    plan_weeks_since_assignment: null,
    package_status: "none",
    appointment_status: "unplanned",
    activity_status: "inactive",
    next_appointment_date: null,
    has_active_plan: false,
  };

  const result = mapRpcRowToComputedData(rpcRow);

  assertEquals(result.plan_weeks_since_assignment, null);
});
