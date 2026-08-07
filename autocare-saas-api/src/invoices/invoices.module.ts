import { Module } from "@nestjs/common";
import { SequencesModule } from "../sequences/sequences.module";
import { InvoiceCalculatorService } from "./invoice-calculator.service";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";

@Module({
  imports: [SequencesModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceCalculatorService],
})
export class InvoicesModule {}
