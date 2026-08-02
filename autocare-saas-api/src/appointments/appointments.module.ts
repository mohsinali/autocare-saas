import { Module } from "@nestjs/common";
import { BranchesModule } from "../branches/branches.module";
import { TimezoneModule } from "../timezone/timezone.module";
import { VehiclesModule } from "../vehicles/vehicles.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsRepository } from "./repositories/appointments.repository";

@Module({
  imports: [BranchesModule, VehiclesModule, TimezoneModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
