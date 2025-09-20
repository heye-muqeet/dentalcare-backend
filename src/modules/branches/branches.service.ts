import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
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

    // Only create Branch Admin if the branch is active and admin data is provided
    if (createBranchDto.isActive && createBranchDto.branchAdminEmail) {
      await this.createBranchAdmin({
        firstName: createBranchDto.branchAdminFirstName,
        lastName: createBranchDto.branchAdminLastName,
        email: createBranchDto.branchAdminEmail,
        password: createBranchDto.branchAdminPassword,
        phone: createBranchDto.branchAdminPhone,
        address: createBranchDto.branchAdminAddress,
        dateOfBirth: createBranchDto.branchAdminDateOfBirth,
        employeeId: createBranchDto.branchAdminEmployeeId,
      }, (savedBranch._id as any).toString(), organizationId, createdBy);
    }

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
    // Validate required fields
    if (!createBranchAdminDto.email) {
      throw new Error('Branch admin email is required');
    }
    if (!createBranchAdminDto.firstName) {
      throw new Error('Branch admin first name is required');
    }
    if (!createBranchAdminDto.lastName) {
      throw new Error('Branch admin last name is required');
    }
    if (!createBranchAdminDto.password) {
      throw new Error('Branch admin password is required');
    }
    if (!createBranchAdminDto.phone) {
      throw new Error('Branch admin phone is required');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createBranchAdminDto.password, saltRounds);

    const branchAdmin = new this.branchAdminModel({
      ...createBranchAdminDto,
      password: hashedPassword,
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

  async getBranchesStats(userRole: string, userOrganizationId?: string): Promise<any> {
    try {
      let query = {};
      
      if (userRole === 'super_admin') {
        // Super admin can see stats for all branches
      } else if (userRole === 'organization_admin' && userOrganizationId) {
        // Organization admin can see stats for branches in their organization
        query = { organizationId: userOrganizationId };
      } else {
        throw new ForbiddenException('Insufficient permissions to access branch statistics');
      }

      const [
        totalBranches,
        activeBranches,
        inactiveBranches,
        totalDoctors,
        totalReceptionists,
        totalPatients
      ] = await Promise.all([
        this.branchModel.countDocuments(query).exec(),
        this.branchModel.countDocuments({ ...query, isActive: true }).exec(),
        this.branchModel.countDocuments({ ...query, isActive: false }).exec(),
        this.doctorModel.countDocuments(userOrganizationId ? { organizationId: userOrganizationId } : {}).exec(),
        this.receptionistModel.countDocuments(userOrganizationId ? { organizationId: userOrganizationId } : {}).exec(),
        this.patientModel.countDocuments(userOrganizationId ? { organizationId: userOrganizationId } : {}).exec(),
      ]);

      const totalStaff = totalDoctors + totalReceptionists;

      return {
        success: true,
        data: {
          totalBranches,
          activeBranches,
          inactiveBranches,
          totalStaff,
          totalDoctors,
          totalReceptionists,
          totalPatients,
        }
      };
    } catch (error) {
      console.error('Error fetching branches stats:', error);
      throw error;
    }
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
