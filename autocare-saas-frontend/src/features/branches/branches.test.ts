import { describe, expect, it } from "vitest";
import { branchQueryKeys } from "./branch-query-keys";
import { branchFormSchema } from "./branch-schema";

const validBranch = {
  name: "Downtown Workshop",
  phone: "+1 212 555 0100",
  email: "downtown@example.com",
  addressLine1: "10 Main Street",
  addressLine2: "",
  city: "New York",
  stateProvince: "NY",
  postalCode: "10001",
  country: "United States",
  timezone: "America/New_York",
  businessOpeningTime: "09:00",
  businessClosingTime: "18:00",
  isActive: true,
};

describe("branch form schema", () => {
  it("accepts the backend branch contract", () => {
    expect(branchFormSchema.safeParse(validBranch).success).toBe(true);
  });

  it("rejects invalid IANA timezones", () => {
    const result = branchFormSchema.safeParse({
      ...validBranch,
      timezone: "UTC+5",
    });
    expect(result.success).toBe(false);
  });

  it("requires closing time to be after opening time", () => {
    const result = branchFormSchema.safeParse({
      ...validBranch,
      businessOpeningTime: "18:00",
      businessClosingTime: "09:00",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === "businessClosingTime",
        ),
      ).toBe(true);
  });
});

describe("branch query keys", () => {
  it("keeps list filters and detail identities stable", () => {
    expect(
      branchQueryKeys.list({ page: 2, limit: 10, search: "north" }),
    ).toEqual(["branches", "list", { page: 2, limit: 10, search: "north" }]);
    expect(branchQueryKeys.detail("branch-id")).toEqual([
      "branches",
      "detail",
      "branch-id",
    ]);
  });
});
