import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../../schemas/organization.schema';
import { OrganizationAdmin, OrganizationAdminDocument } from '../../schemas/organization-admin.schema';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationAdmin.name) private orgAdminModel: Model<OrganizationAdminDocument>,
  ) {}

  async create(createOrganizationDto: any, createdBy: string): Promise<Organization> {
    const organization = new this.organizationModel({
      ...createOrganizationDto,
      createdBy,
    });

    return organization.save();
  }

  async findAll(userRole: string, userOrganizationId?: string): Promise<Organization[]> {
    if (userRole === 'super_admin') {
      return this.organizationModel.find().populate('createdBy', 'firstName lastName email').exec();
    }
    
    if (userRole === 'organization_admin' && userOrganizationId) {
      return this.organizationModel.find({ _id: userOrganizationId }).populate('createdBy', 'firstName lastName email').exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async findOne(id: string, userRole: string, userOrganizationId?: string): Promise<Organization> {
    const organization = await this.organizationModel.findById(id).populate('createdBy', 'firstName lastName email').exec();
    
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
    if (userRole === 'super_admin') {
      return this.organizationModel.findByIdAndUpdate(id, updateOrganizationDto, { new: true }).exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId === id) {
      return this.organizationModel.findByIdAndUpdate(id, updateOrganizationDto, { new: true }).exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async remove(id: string, userRole: string): Promise<Organization | null> {
    if (userRole !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can delete organizations');
    }

    return this.organizationModel.findByIdAndDelete(id).exec();
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
