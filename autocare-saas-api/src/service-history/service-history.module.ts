import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module'; import { ServiceHistoryController } from './service-history.controller'; import { ServiceHistoryService } from './service-history.service'; import { ServiceHistoryRepository } from './repositories/service-history.repository';
@Module({ imports: [VehiclesModule], controllers: [ServiceHistoryController], providers: [ServiceHistoryService, ServiceHistoryRepository] }) export class ServiceHistoryModule {}
