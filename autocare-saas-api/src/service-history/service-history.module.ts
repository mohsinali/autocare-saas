import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module'; import { ServiceHistoryController } from './service-history.controller'; import { ServiceHistoryService } from './service-history.service'; import { ServiceHistoryRepository } from './repositories/service-history.repository';
@Module({ imports: [CustomersModule], controllers: [ServiceHistoryController], providers: [ServiceHistoryService, ServiceHistoryRepository] }) export class ServiceHistoryModule {}
