import { SequenceKey } from "@prisma/client";
import { SequencesService } from "./sequences.service";

describe("SequencesService", () => {
  it("uses tenant/key upsert with atomic increment and returns its value", async () => {
    const upsert = jest.fn().mockResolvedValue({ currentValue: 2 });
    const tx = { sequence: { upsert } };
    const value = await new SequencesService().nextValue(
      tx as never,
      "70a5c60c-bcbd-46b9-872d-e00608447d10",
      SequenceKey.INVOICE,
    );
    expect(value).toBe(2);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_key: {
            tenantId: "70a5c60c-bcbd-46b9-872d-e00608447d10",
            key: SequenceKey.INVOICE,
          },
        },
        create: expect.objectContaining({ currentValue: 1 }),
        update: { currentValue: { increment: 1 } },
      }),
    );
  });

  it("scopes independent first values by tenant without using VehicleSequence", async () => {
    const upsert = jest.fn().mockResolvedValue({ currentValue: 1 });
    const service = new SequencesService();
    await service.nextValue(
      { sequence: { upsert } } as never,
      "tenant-a",
      SequenceKey.INVOICE,
    );
    await service.nextValue(
      { sequence: { upsert } } as never,
      "tenant-b",
      SequenceKey.INVOICE,
    );
    expect(upsert.mock.calls[0][0].where.tenantId_key.tenantId).toBe(
      "tenant-a",
    );
    expect(upsert.mock.calls[1][0].where.tenantId_key.tenantId).toBe(
      "tenant-b",
    );
    expect(upsert.mock.calls.flat().join(" ")).not.toContain("vehicleSequence");
  });
});
