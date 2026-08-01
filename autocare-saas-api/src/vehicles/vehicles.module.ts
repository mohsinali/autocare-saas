import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './repositories/vehicles.repository';
@Module({ imports: [CustomersModule], controllers: [VehiclesController], providers: [VehiclesService, VehiclesRepository], exports: [VehiclesService] })
export class VehiclesModule {}
