import { describe, expect, it } from "vitest";
import { currencies } from "./currencies";
import { settingsQueryKeys } from "./settings-query-keys";
import { settingsFormSchema } from "./settings-schema";

describe("tenant settings", () => {
  it("accepts a three-letter uppercase currency code", () => {
    expect(settingsFormSchema.safeParse({ currencyCode: "PKR" }).success).toBe(
      true,
    );
  });

  it.each(["", "US", "usd", "U1D"])(
    "rejects invalid currency code %s",
    (currencyCode) => {
      expect(settingsFormSchema.safeParse({ currencyCode }).success).toBe(
        false,
      );
    },
  );

  it("provides the supported currency codes and stable query key", () => {
    expect(currencies.find((currency) => currency.code === "USD")?.name).toBe(
      "US Dollar",
    );
    expect(currencies.find((currency) => currency.code === "PKR")?.name).toBe(
      "Pakistani Rupee",
    );
    expect(settingsQueryKeys.all).toEqual(["tenant-settings"]);
  });
});
