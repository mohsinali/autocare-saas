import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateTenantSettingsDto } from "./update-tenant-settings.dto";

describe("UpdateTenantSettingsDto", () => {
  async function errorsFor(currencyCode: unknown) {
    return validate(plainToInstance(UpdateTenantSettingsDto, { currencyCode }));
  }

  it("normalizes lowercase input to uppercase", async () => {
    const dto = plainToInstance(UpdateTenantSettingsDto, {
      currencyCode: "eur",
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.currencyCode).toBe("EUR");
  });

  it.each(["US", "USDD"])("rejects invalid length: %s", async (value) => {
    await expect(errorsFor(value)).resolves.not.toHaveLength(0);
  });

  it.each(["12A", "U$D"])("rejects non-alphabetic input: %s", async (value) => {
    await expect(errorsFor(value)).resolves.not.toHaveLength(0);
  });
});
