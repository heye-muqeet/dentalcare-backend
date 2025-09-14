import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { BranchAdmin, BranchAdminDocument } from '../../schemas/branch-admin.schema';
import { Doctor, DoctorDocument } from '../../schemas/doctor.schema';
import { Receptionist, ReceptionistDocument } from '../../schemas/receptionist.schema';
import { Patient, PatientDocument } from '../../schemas/patient.schema';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(BranchAdmin.name) private branchAdminModel: Model<BranchAdminDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Receptionist.name) private receptionistModel: Model<ReceptionistDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  async create(createBranchDto: any, createdBy: string, organizationId: string): Promise<Branch> {
    const branch = new this.branchModel({
      ...createBranchDto,
      organizationId,
      createdBy,
    });

    const savedBranch = await branch.save();

    // Automatically create a Branch Admin for this branch
    await this.createBranchAdmin({
      firstName: createBranchDto.branchAdminFirstName || 'Branch',
      lastName: createBranchDto.branchAdminLastName || 'Admin',
      email: createBranchDto.branchAdminEmail,
      password: createBranchDto.branchAdminPassword || 'defaultPassword123',
      phone: createBranchDto.branchAdminPhone || '0000000000',
    }, (savedBranch._id as any).toString(), organizationId, createdBy);

    return savedBranch;
  }

  async findAll(userRole: string, userOrganizationId?: string): Promise<Branch[]> {
    if (userRole === 'super_admin') {
      return this.branchModel.find().populate('organizationId createdBy', 'name firstName lastName email').exec();
    }
    
    if (userRole === 'organization_admin' && userOrganizationId) {
      return this.branchModel.find({ organizationId: userOrganizationId }).populate('organizationId createdBy', 'name firstName lastName email').exec();
    }

    if (userRole === 'branch_admin' && userOrganizationId) {
      return this.branchModel.find({ organizationId: userOrganizationId }).populate('organizationId createdBy', 'name firstName lastName email').exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async findOne(id: string, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<Branch> {
    const branch = await this.branchModel.findById(id).populate('organizationId createdBy', 'name firstName lastName email').exec();
    
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (userRole === 'super_admin') {
      return branch;
    }

    if (userRole === 'organization_admin' && userOrganizationId === branch.organizationId.toString()) {
      return branch;
    }

    if (userRole === 'branch_admin' && userBranchId === id) {
      return branch;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async update(id: string, updateBranchDto: any, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<Branch | null> {
    if (userRole === 'super_admin') {
      return this.branchModel.findByIdAndUpdate(id, updateBranchDto, { new: true }).exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId) {
      const branch = await this.branchModel.findById(id).exec();
      if (branch && branch.organizationId.toString() === userOrganizationId) {
        return this.branchModel.findByIdAndUpdate(id, updateBranchDto, { new: true }).exec();
      }
    }

    if (userRole === 'branch_admin' && userBranchId === id) {
      return this.branchModel.findByIdAndUpdate(id, updateBranchDto, { new: true }).exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async remove(id: string, userRole: string, userOrganizationId?: string): Promise<Branch | null> {
    if (userRole === 'super_admin') {
      return this.branchModel.findByIdAndDelete(id).exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId) {
      const branch = await this.branchModel.findById(id).exec();
      if (branch && branch.organizationId.toString() === userOrganizationId) {
        return this.branchModel.findByIdAndDelete(id).exec();
      }
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async createBranchAdmin(createBranchAdminDto: any, branchId: string, organizationId: string, createdBy: string): Promise<BranchAdmin> {
    const branchAdmin = new this.branchAdminModel({
      ...createBranchAdminDto,
      branchId,
      organizationId,
      createdBy,
    });

    return branchAdmin.save();
  }

  async getBranchAdmins(branchId: string, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<BranchAdmin[]> {
    if (userRole === 'super_admin') {
      return this.branchAdminModel.find({ branchId }).populate('createdBy', 'firstName lastName email').exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId) {
      return this.branchAdminModel.find({ branchId, organizationId: userOrganizationId }).populate('createdBy', 'firstName lastName email').exec();
    }

    if (userRole === 'branch_admin' && userBranchId === branchId) {
      return this.branchAdminModel.find({ branchId }).populate('createdBy', 'firstName lastName email').exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async getBranchDoctors(branchId: string, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<Doctor[]> {
    if (userRole === 'super_admin') {
      return this.doctorModel.find({ branchId }).populate('branchId organizationId', 'name').exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId) {
      return this.doctorModel.find({ branchId, organizationId: userOrganizationId }).populate('branchId organizationId', 'name').exec();
    }

    if (userRole === 'branch_admin' && userBranchId === branchId) {
      return this.doctorModel.find({ branchId }).populate('branchId organizationId', 'name').exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async getBranchReceptionists(branchId: string, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<Receptionist[]> {
    if (userRole === 'super_admin') {
      return this.receptionistModel.find({ branchId }).populate('branchId organizationId', 'name').exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId) {
      return this.receptionistModel.find({ branchId, organizationId: userOrganizationId }).populate('branchId organizationId', 'name').exec();
    }

    if (userRole === 'branch_admin' && userBranchId === branchId) {
      return this.receptionistModel.find({ branchId }).populate('branchId organizationId', 'name').exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async getBranchPatients(branchId: string, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<Patient[]> {
    if (userRole === 'super_admin') {
      return this.patientModel.find({ branchId }).populate('branchId organizationId', 'name').exec();
    }

    if (userRole === 'organization_admin' && userOrganizationId) {
      return this.patientModel.find({ branchId, organizationId: userOrganizationId }).populate('branchId organizationId', 'name').exec();
    }

    if (userRole === 'branch_admin' && userBranchId === branchId) {
      return this.patientModel.find({ branchId }).populate('branchId organizationId', 'name').exec();
    }

    if (userRole === 'receptionist' && userBranchId === branchId) {
      return this.patientModel.find({ branchId }).populate('branchId organizationId', 'name').exec();
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async getBranchStats(branchId: string, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<any> {
    if (userRole === 'super_admin') {
      // Super admin can see stats for any branch
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      // Organization admin can see stats for branches in their organization
    } else if (userRole === 'branch_admin' && userBranchId === branchId) {
      // Branch admin can see stats for their branch
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const [doctorsCount, receptionistsCount, patientsCount] = await Promise.all([
      this.doctorModel.countDocuments({ branchId }).exec(),
      this.receptionistModel.countDocuments({ branchId }).exec(),
      this.patientModel.countDocuments({ branchId }).exec(),
    ]);

    return {
      branchId,
      totalDoctors: doctorsCount,
      totalReceptionists: receptionistsCount,
      totalPatients: patientsCount,
    };
  }
}
