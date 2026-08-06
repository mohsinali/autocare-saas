import {
  serviceHistoryService,
  type ServiceHistoryInput,
  type ServiceLineItemInput,
} from "../../services/api/service-history.service";
import { lineItemSchema } from "./service-history-schema";

type CreateWorkflowService = Pick<
  typeof serviceHistoryService,
  "create" | "createLineItem"
>;

export function initialLineItemsForPayload(
  included: boolean,
  input: ServiceLineItemInput,
): ServiceLineItemInput[] | undefined {
  if (!included) return undefined;
  const parsed = lineItemSchema.parse(input);
  return [{ ...parsed, notes: parsed.notes || undefined }];
}

export class InitialLineItemCreationError extends Error {
  constructor(
    readonly serviceHistory: Awaited<
      ReturnType<typeof serviceHistoryService.create>
    >,
    readonly cause: unknown,
  ) {
    super(
      "The active job was created, but the initial line item could not be added.",
    );
    this.name = "InitialLineItemCreationError";
  }
}

export async function createServiceHistoryWithInitialLineItem(
  input: ServiceHistoryInput,
  service: CreateWorkflowService = serviceHistoryService,
) {
  const { lineItems, ...historyInput } = input;
  const serviceHistory = await service.create(historyInput);
  const initialLineItem = lineItems?.[0];
  if (!initialLineItem) return serviceHistory;
  try {
    await service.createLineItem(serviceHistory.id, initialLineItem);
  } catch (error) {
    throw new InitialLineItemCreationError(serviceHistory, error);
  }
  return serviceHistory;
}
