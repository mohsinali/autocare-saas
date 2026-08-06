import { Module } from "@nestjs/common";
import { BranchesModule } from "../branches/branches.module";
import { CustomersModule } from "../customers/customers.module";
import { VehiclesModule } from "../vehicles/vehicles.module";
import { ServiceLineItemRepository } from "./repositories/service-line-item.repository";
import { ServiceHistoryRepository } from "./repositories/service-history.repository";
import { ServiceHistoryController } from "./service-history.controller";
import { ServiceHistoryService } from "./service-history.service";
import { ServiceLineItemController } from "./service-line-item.controller";
import { ServiceLineItemService } from "./service-line-item.service";

@Module({
  imports: [VehiclesModule, CustomersModule, BranchesModule],
  controllers: [ServiceHistoryController, ServiceLineItemController],
  providers: [
    ServiceHistoryService,
    ServiceHistoryRepository,
    ServiceLineItemService,
    ServiceLineItemRepository,
  ],
})
export class ServiceHistoryModule {}
