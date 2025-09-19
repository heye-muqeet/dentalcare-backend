import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Organization, OrganizationDocument } from '../../schemas/organization.schema';
import { OrganizationAdmin, OrganizationAdminDocument } from '../../schemas/organization-admin.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { BranchAdmin, BranchAdminDocument } from '../../schemas/branch-admin.schema';
import { Doctor, DoctorDocument } from '../../schemas/doctor.schema';
import { Patient, PatientDocument } from '../../schemas/patient.schema';
import { Receptionist, ReceptionistDocument } from '../../schemas/receptionist.schema';
import { SoftDeleteService } from '../../services/soft-delete.service';
import { SoftDeleteQueryOptions, SoftDeleteOptions, RestoreOptions } from '../../schemas/base/soft-delete.schema';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationAdmin.name) private orgAdminModel: Model<OrganizationAdminDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(BranchAdmin.name) private branchAdminModel: Model<BranchAdminDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Receptionist.name) private receptionistModel: Model<ReceptionistDocument>,
    private softDeleteService: SoftDeleteService,
  ) {}

  async create(createOrganizationDto: any, createdBy: string): Promise<Organization> {
    const organization = new this.organizationModel({
      ...createOrganizationDto,
      createdBy,
    });

    return organization.save();
  }

  async findAll(userRole: string, userOrganizationId?: string, options: SoftDeleteQueryOptions = {}): Promise<Organization[]> {
    let baseFilter: FilterQuery<OrganizationDocument> = {};
    
    if (userRole === 'super_admin') {
      // Super admin can see all organizations
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      baseFilter._id = userOrganizationId;
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const filter = this.softDeleteService.buildSoftDeleteFilter(baseFilter, options);
    return this.organizationModel.find(filter).populate('createdBy', 'firstName lastName email').exec();
  }

  async findOne(id: string, userRole: string, userOrganizationId?: string, options: SoftDeleteQueryOptions = {}): Promise<Organization> {
    const filter = this.softDeleteService.buildSoftDeleteFilter({ _id: id }, options);
    const organization = await this.organizationModel.findOne(filter).populate('createdBy', 'firstName lastName email').exec();
    
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (userRole === 'super_admin') {
      return organization;
    }

    if (userRole === 'organization_admin' && userOrganizationId === id) {
      return organization;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async update(id: string, updateOrganizationDto: any, userRole: string, userOrganizationId?: string): Promise<Organization | null> {
    const filter = this.softDeleteService.buildSoftDeleteFilter({ _id: id });
    
    if (userRole === 'super_admin') {
      return this.organizationModel.findOneAndUpdate(filter, updateOrganizationDto, { new: true }).exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId === id) {
      return this.organizationModel.findOneAndUpdate(filter, updateOrganizationDto, { new: true }).exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  // Cascade soft delete organization and all related entities
  async cascadeSoftDelete(
    id: string, 
    userRole: string, 
    options: SoftDeleteOptions,
    auditContext?: any
  ): Promise<{
    parent: Organization | null;
    cascaded: Array<{ modelName: string; deletedCount: number; documents: any[] }>;
  }> {
    if (userRole !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can delete organizations');
    }

    // Define cascade rules for organization deletion
    const cascadeRules = [
      { model: this.branchModel, foreignKey: 'organizationId', modelName: 'Branch' },
      { model: this.orgAdminModel, foreignKey: 'organizationId', modelName: 'OrganizationAdmin' },
      { model: this.branchAdminModel, foreignKey: 'organizationId', modelName: 'BranchAdmin' },
      { model: this.doctorModel, foreignKey: 'organizationId', modelName: 'Doctor' },
      { model: this.patientModel, foreignKey: 'organizationId', modelName: 'Patient' },
      { model: this.receptionistModel, foreignKey: 'organizationId', modelName: 'Receptionist' },
    ];

    return this.softDeleteService.cascadeSoftDelete(
      this.organizationModel,
      id,
      cascadeRules,
      options,
      auditContext
    );
  }

  // Cascade restore organization and related entities
  async cascadeRestore(
    id: string,
    userRole: string,
    options: RestoreOptions,
    auditContext?: any
  ): Promise<{
    parent: Organization | null;
    cascaded: Array<{ modelName: string; restoredCount: number; documents: any[] }>;
  }> {
    if (userRole !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can restore organizations');
    }

    // Define cascade rules for organization restoration
    const cascadeRules = [
      { model: this.branchModel, foreignKey: 'organizationId', modelName: 'Branch' },
      { model: this.orgAdminModel, foreignKey: 'organizationId', modelName: 'OrganizationAdmin' },
      { model: this.branchAdminModel, foreignKey: 'organizationId', modelName: 'BranchAdmin' },
      { model: this.doctorModel, foreignKey: 'organizationId', modelName: 'Doctor' },
      { model: this.patientModel, foreignKey: 'organizationId', modelName: 'Patient' },
      { model: this.receptionistModel, foreignKey: 'organizationId', modelName: 'Receptionist' },
    ];

    return this.softDeleteService.cascadeRestore(
      this.organizationModel,
      id,
      cascadeRules,
      options,
      auditContext
    );
  }

  // Legacy method for backward compatibility - now does cascade soft delete
  async remove(id: string, userRole: string, options: SoftDeleteOptions = {}, auditContext?: any) {
    return this.cascadeSoftDelete(id, userRole, options, auditContext);
  }

  // Permanent delete (hard delete) - only for super admins
  async permanentDelete(id: string, userRole: string, auditContext?: any): Promise<Organization | null> {
    if (userRole !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can permanently delete organizations');
    }

    return this.softDeleteService.permanentDelete(this.organizationModel, id, auditContext);
  }

  async getOrganizationAdmins(organizationId: string, userRole: string, userOrganizationId?: string): Promise<OrganizationAdmin[]> {
    if (userRole === 'super_admin') {
      return this.orgAdminModel.find({ organizationId }).populate('createdBy', 'firstName lastName email').exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId === organizationId) {
      return this.orgAdminModel.find({ organizationId }).populate('createdBy', 'firstName lastName email').exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async createOrganizationAdmin(organizationId: string, createOrgAdminDto: any, createdBy: string): Promise<OrganizationAdmin> {
    const orgAdmin = new this.orgAdminModel({
      ...createOrgAdminDto,
      organizationId,
      createdBy,
    });

    return orgAdmin.save();
  }

  async getOrganizationStats(organizationId: string, userRole: string, userOrganizationId?: string): Promise<any> {
    if (userRole === 'super_admin') {
      // Super admin can see stats for any organization
    } else if (userRole === 'organization_admin' && userOrganizationId === organizationId) {
      // Organization admin can see stats for their organization
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // This would typically include counts of branches, admins, doctors, etc.
    // For now, returning basic structure
    return {
      organizationId,
      totalBranches: 0,
      totalAdmins: 0,
      totalDoctors: 0,
      totalReceptionists: 0,
      totalPatients: 0,
    };
  }
}
