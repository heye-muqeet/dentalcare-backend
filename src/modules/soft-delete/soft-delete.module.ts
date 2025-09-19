import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SoftDeleteController } from './soft-delete.controller';
import { SoftDeleteService } from '../../services/soft-delete.service';
import { AuditLoggerService } from '../../services/audit-logger.service';

// Import schemas
import { Organization, OrganizationSchema } from '../../schemas/organization.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { Patient, PatientSchema } from '../../schemas/patient.schema';
import { Doctor, DoctorSchema } from '../../schemas/doctor.schema';
import { BranchAdmin, BranchAdminSchema } from '../../schemas/branch-admin.schema';
import { OrganizationAdmin, OrganizationAdminSchema } from '../../schemas/organization-admin.schema';
import { Receptionist, ReceptionistSchema } from '../../schemas/receptionist.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: BranchAdmin.name, schema: BranchAdminSchema },
      { name: OrganizationAdmin.name, schema: OrganizationAdminSchema },
      { name: Receptionist.name, schema: ReceptionistSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ])
  ],
  controllers: [SoftDeleteController],
  providers: [SoftDeleteService, AuditLoggerService],
  exports: [SoftDeleteService]
})
export class SoftDeleteModule {}
