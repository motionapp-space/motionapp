import { describe, it, expect } from "vitest";
import { getDefaultFilters, filtersToSearchParams } from "./filters";

describe("getDefaultFilters", () => {
  it("returns default values for empty search params", () => {
    const sp = new URLSearchParams();
    const filters = getDefaultFilters(sp);
    
    expect(filters.q).toBe("");
    expect(filters.sort).toBe("updated_desc");
    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(25);
  });

  it("parses q parameter", () => {
    const sp = new URLSearchParams("q=test");
    const filters = getDefaultFilters(sp);
    expect(filters.q).toBe("test");
  });

  it("parses boolean filters", () => {
    const sp = new URLSearchParams("withoutPlan=true&packageToRenew=true");
    const filters = getDefaultFilters(sp);
    expect(filters.withoutPlan).toBe(true);
    expect(filters.packageToRenew).toBe(true);
  });

  it("sanitizes legacy plan_weeks_asc to updated_desc", () => {
    const sp = new URLSearchParams("sort=plan_weeks_asc");
    const filters = getDefaultFilters(sp);
    expect(filters.sort).toBe("updated_desc");
  });

  it("sanitizes legacy plan_weeks_desc to updated_desc", () => {
    const sp = new URLSearchParams("sort=plan_weeks_desc");
    const filters = getDefaultFilters(sp);
    expect(filters.sort).toBe("updated_desc");
  });

  it("preserves valid sort values", () => {
    const sp = new URLSearchParams("sort=name_asc");
    const filters = getDefaultFilters(sp);
    expect(filters.sort).toBe("name_asc");
  });

  it("parses array filters", () => {
    const sp = new URLSearchParams("packageStatus=active&packageStatus=low");
    const filters = getDefaultFilters(sp);
    expect(filters.packageStatuses).toEqual(["active", "low"]);
  });

  it("parses lastAccessDays as number", () => {
    const sp = new URLSearchParams("lastAccessDays=30");
    const filters = getDefaultFilters(sp);
    expect(filters.lastAccessDays).toBe(30);
  });

  it("parses includeArchived", () => {
    const sp = new URLSearchParams("includeArchived=true");
    const filters = getDefaultFilters(sp);
    expect(filters.includeArchived).toBe(true);
  });
});

describe("filtersToSearchParams", () => {
  it("converts basic filters to search params", () => {
    const sp = filtersToSearchParams({
      q: "test",
      sort: "name_asc",
      page: 2,
      limit: 10,
    });
    
    expect(sp.get("q")).toBe("test");
    expect(sp.get("sort")).toBe("name_asc");
    expect(sp.get("page")).toBe("2");
    expect(sp.get("limit")).toBe("10");
  });

  it("converts boolean filters", () => {
    const sp = filtersToSearchParams({
      withoutPlan: true,
      packageToRenew: true,
    });
    
    expect(sp.get("withoutPlan")).toBe("true");
    expect(sp.get("packageToRenew")).toBe("true");
  });

  it("converts array filters", () => {
    const sp = filtersToSearchParams({
      packageStatuses: ["active", "low"],
    });
    
    expect(sp.getAll("packageStatus")).toEqual(["active", "low"]);
  });

  it("omits undefined values", () => {
    const sp = filtersToSearchParams({
      q: undefined,
      withoutPlan: undefined,
    });
    
    expect(sp.has("q")).toBe(false);
    expect(sp.has("withoutPlan")).toBe(false);
  });
});
