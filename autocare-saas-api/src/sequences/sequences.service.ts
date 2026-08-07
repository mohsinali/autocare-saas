import { Injectable } from "@nestjs/common";
import { Prisma, SequenceKey } from "@prisma/client";

@Injectable()
export class SequencesService {
  async nextValue(
    tx: Prisma.TransactionClient,
    tenantId: string,
    key: SequenceKey,
  ): Promise<number> {
    const sequence = await tx.sequence.upsert({
      where: { tenantId_key: { tenantId, key } },
      create: { tenantId, key, currentValue: 1 },
      update: { currentValue: { increment: 1 } },
      select: { currentValue: true },
    });
    return sequence.currentValue;
  }
}
