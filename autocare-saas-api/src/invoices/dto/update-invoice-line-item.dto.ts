import { PartialType } from "@nestjs/swagger";
import { CreateInvoiceLineItemDto } from "./create-invoice-line-item.dto";

export class UpdateInvoiceLineItemDto extends PartialType(
  CreateInvoiceLineItemDto,
) {}
