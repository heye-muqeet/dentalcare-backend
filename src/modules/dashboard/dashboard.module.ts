import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Organization, OrganizationSchema } from '../../schemas/organization.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { SuperAdmin, SuperAdminSchema } from '../../schemas/super-admin.schema';
import { OrganizationAdmin, OrganizationAdminSchema } from '../../schemas/organization-admin.schema';
import { BranchAdmin, BranchAdminSchema } from '../../schemas/branch-admin.schema';
import { Doctor, DoctorSchema } from '../../schemas/doctor.schema';
import { Receptionist, ReceptionistSchema } from '../../schemas/receptionist.schema';
import { Patient, PatientSchema } from '../../schemas/patient.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: SuperAdmin.name, schema: SuperAdminSchema },
      { name: OrganizationAdmin.name, schema: OrganizationAdminSchema },
      { name: BranchAdmin.name, schema: BranchAdminSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Receptionist.name, schema: ReceptionistSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
