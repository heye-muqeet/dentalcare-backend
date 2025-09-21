import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { BranchAdmin, BranchAdminSchema } from '../../schemas/branch-admin.schema';
import { Doctor, DoctorSchema } from '../../schemas/doctor.schema';
import { Receptionist, ReceptionistSchema } from '../../schemas/receptionist.schema';
import { Patient, PatientSchema } from '../../schemas/patient.schema';
import { Service, ServiceSchema } from '../../schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: BranchAdmin.name, schema: BranchAdminSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Receptionist.name, schema: ReceptionistSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
