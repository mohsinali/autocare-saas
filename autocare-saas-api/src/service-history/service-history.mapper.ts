import { Prisma, ServiceLineItem } from "@prisma/client";
import { ServiceHistoryDetail } from "./repositories/service-history.repository";

export interface ServiceLineItemResponse extends ServiceLineItem {
  lineTotal: string;
}

export type ServiceHistoryResponse = Omit<ServiceHistoryDetail, "lineItems"> & {
  lineItems: ServiceLineItemResponse[];
  subtotal: string;
};

export function mapLineItem(item: ServiceLineItem): ServiceLineItemResponse {
  return { ...item, lineTotal: item.quantity.mul(item.unitPrice).toFixed(2) };
}

export function mapServiceHistory(
  history: ServiceHistoryDetail,
): ServiceHistoryResponse {
  const lineItems = history.lineItems.map(mapLineItem);
  const subtotal = history.lineItems.reduce(
    (total, item) => total.add(item.quantity.mul(item.unitPrice)),
    new Prisma.Decimal(0),
  );
  return { ...history, lineItems, subtotal: subtotal.toFixed(2) };
}
