import { describe, it, expect } from "vitest";
import { 
  sanitizeSearchQuery, 
  applyActivePlanFilter, 
  paginateIds, 
  reorderByIds 
} from "./clients.api";

describe("sanitizeSearchQuery", () => {
  it("trims and limits to 80 chars", () => {
    const long = "a".repeat(100);
    expect(sanitizeSearchQuery(`  ${long}  `)).toHaveLength(80);
  });

  it("escapes SQL wildcards", () => {
    expect(sanitizeSearchQuery("test%user_name")).toBe("test\\%user\\_name");
  });

  it("escapes backslash before wildcards", () => {
    expect(sanitizeSearchQuery("a\\b%")).toBe("a\\\\b\\%");
  });

  it("handles complex escaping", () => {
    // Input (raw): \%\_ (backslash, percent, backslash, underscore)
    // Step 1: \ → \\ so we get: \\%\\_
    // Step 2: % → \% so we get: \\\%\\_  
    // Step 3: _ → \_ so we get: \\\%\\\_
    expect(sanitizeSearchQuery("\\%\\_")).toBe("\\\\\\%\\\\\\_");
  });

  it("handles empty string", () => {
    expect(sanitizeSearchQuery("")).toBe("");
  });

  it("handles whitespace only", () => {
    expect(sanitizeSearchQuery("   ")).toBe("");
  });
});

describe("applyActivePlanFilter", () => {
  const ids = ["a", "b", "c"];
  const activeSet = new Set(["a", "c"]);

  it("filters to active when withActivePlan=true", () => {
    const result = applyActivePlanFilter(ids, activeSet, { withActivePlan: true });
    expect(result).toEqual(["a", "c"]);
  });

  it("filters to inactive when withoutPlan=true", () => {
    const result = applyActivePlanFilter(ids, activeSet, { withoutPlan: true });
    expect(result).toEqual(["b"]);
  });

  it("withActivePlan takes precedence over withoutPlan", () => {
    const result = applyActivePlanFilter(ids, activeSet, { 
      withActivePlan: true, 
      withoutPlan: true 
    });
    expect(result).toEqual(["a", "c"]);
  });

  it("returns all when no filter", () => {
    const result = applyActivePlanFilter(ids, activeSet, {});
    expect(result).toEqual(ids);
  });

  it("returns empty when withActivePlan=true and activeSet is empty", () => {
    const result = applyActivePlanFilter(ids, new Set(), { withActivePlan: true });
    expect(result).toEqual([]);
  });

  it("returns all when withoutPlan=true and activeSet is empty", () => {
    const result = applyActivePlanFilter(ids, new Set(), { withoutPlan: true });
    expect(result).toEqual(ids);
  });

  it("handles empty ids array", () => {
    const result = applyActivePlanFilter([], activeSet, { withActivePlan: true });
    expect(result).toEqual([]);
  });
});

describe("paginateIds", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("returns first page correctly", () => {
    expect(paginateIds(ids, 1, 2)).toEqual(["a", "b"]);
  });

  it("returns second page correctly", () => {
    expect(paginateIds(ids, 2, 2)).toEqual(["c", "d"]);
  });

  it("returns partial last page", () => {
    expect(paginateIds(ids, 3, 2)).toEqual(["e"]);
  });

  it("returns empty for page beyond range", () => {
    expect(paginateIds(ids, 10, 2)).toEqual([]);
  });

  it("handles empty ids", () => {
    expect(paginateIds([], 1, 10)).toEqual([]);
  });

  it("handles limit larger than ids", () => {
    expect(paginateIds(ids, 1, 100)).toEqual(ids);
  });
});

describe("reorderByIds", () => {
  const items = [
    { id: "c", name: "C" },
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ];

  it("reorders items to match id order", () => {
    const result = reorderByIds(items, ["a", "b", "c"]);
    expect(result.map(i => i.id)).toEqual(["a", "b", "c"]);
  });

  it("pushes items not in orderedIds to the end", () => {
    const itemsWithExtra = [
      { id: "c", name: "C" },
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "x", name: "X" },
    ];
    const result = reorderByIds(itemsWithExtra, ["a", "b", "c"]);
    expect(result.map(i => i.id)).toEqual(["a", "b", "c", "x"]);
  });

  it("handles multiple items not in orderedIds", () => {
    const result = reorderByIds(
      [{ id: "z" }, { id: "a" }, { id: "y" }], 
      ["a"]
    );
    expect(result[0].id).toBe("a");
    expect(result.slice(1).map(i => i.id)).toContain("z");
    expect(result.slice(1).map(i => i.id)).toContain("y");
  });

  it("handles empty items array", () => {
    const result = reorderByIds([], ["a", "b"]);
    expect(result).toEqual([]);
  });

  it("handles empty orderedIds", () => {
    const result = reorderByIds(items, []);
    // All items should be at "MAX" position, stable sort
    expect(result.length).toBe(3);
  });

  it("does not mutate original array", () => {
    const original = [...items];
    reorderByIds(items, ["a", "b", "c"]);
    expect(items).toEqual(original);
  });
});
