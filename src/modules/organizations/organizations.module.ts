import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { Organization, OrganizationSchema } from '../../schemas/organization.schema';
import { OrganizationAdmin, OrganizationAdminSchema } from '../../schemas/organization-admin.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';
import { BranchAdmin, BranchAdminSchema } from '../../schemas/branch-admin.schema';
import { Doctor, DoctorSchema } from '../../schemas/doctor.schema';
import { Patient, PatientSchema } from '../../schemas/patient.schema';
import { Receptionist, ReceptionistSchema } from '../../schemas/receptionist.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import { SoftDeleteService } from '../../services/soft-delete.service';
import { AuditLoggerService } from '../../services/audit-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationAdmin.name, schema: OrganizationAdminSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: BranchAdmin.name, schema: BranchAdminSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Receptionist.name, schema: ReceptionistSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, SoftDeleteService, AuditLoggerService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
