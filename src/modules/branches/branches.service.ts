import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    console.log('BranchesService.create called with:', {
      branchData: createBranchDto,
      createdBy,
      organizationId
    });

    const branch = new this.branchModel({
      ...createBranchDto,
      organizationId,
      createdBy,
      isDeleted: false, // Explicitly set to false
    });

    console.log('Creating branch with data:', branch.toObject());
    const savedBranch = await branch.save();
    console.log('Branch saved successfully:', savedBranch._id);

    // Only create Branch Admin if the branch is active and admin data is provided
    if (createBranchDto.isActive && createBranchDto.branchAdminEmail) {
      console.log('Creating branch admin for active branch');
      try {
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
        console.log('Branch admin created successfully');
      } catch (adminError) {
        console.error('Failed to create branch admin:', adminError);
        // Don't fail the entire branch creation if admin creation fails
      }
    }

    console.log('Returning saved branch:', savedBranch._id);
    return savedBranch;
  }

  async findAll(userRole: string, userOrganizationId?: string): Promise<Branch[]> {
    console.log('BranchesService.findAll called with:', { userRole, userOrganizationId });
    
    let query = {};
    
    if (userRole === 'super_admin') {
      // Super admin can see all non-deleted branches
      query = { isDeleted: { $ne: true } };
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      // Organization admin can see their organization's non-deleted branches
      query = { organizationId: userOrganizationId, isDeleted: { $ne: true } };
    } else if (userRole === 'branch_admin' && userOrganizationId) {
      // Branch admin can see their organization's non-deleted branches
      query = { organizationId: userOrganizationId, isDeleted: { $ne: true } };
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    console.log('BranchesService.findAll query:', query);
    
    const branches = await this.branchModel
      .find(query)
      .populate('organizationId createdBy', 'name firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
      
    console.log('BranchesService.findAll found branches:', branches.length);
    return branches;
  }

  async findOne(id: string, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<any> {
    console.log('BranchesService.findOne called:', { id, userRole, userOrganizationId, userBranchId });
    
    const branch = await this.branchModel.findById(id).populate('organizationId createdBy', 'name firstName lastName email').exec();
    
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Robust organization ID extraction and comparison
    const extractOrganizationId = (orgId: any): string => {
      if (typeof orgId === 'string') return orgId;
      if (orgId?._id) return orgId._id.toString();
      if (orgId?.id) return orgId.id.toString();
      return String(orgId);
    };

    const userOrgIdString = extractOrganizationId(userOrganizationId);
    const branchOrgIdString = extractOrganizationId(branch.organizationId);

    console.log('Detailed Organization ID Comparison:', {
      userRole,
      userOrgIdString,
      branchOrgIdString,
      comparisonResult: userOrgIdString === branchOrgIdString
    });

    // Comprehensive permission check
    const isPermitted = 
      userRole === 'super_admin' || 
      (userRole === 'organization_admin' && 
        userOrgIdString === branchOrgIdString) ||
      (userRole === 'branch_admin' && userBranchId === id);

    if (!isPermitted) {
      console.log('Access Denied - Detailed Permissions:', {
        userRole,
        userOrganizationId: userOrgIdString,
        branchOrganizationId: branchOrgIdString,
        message: 'Organization admin does not have access to this branch'
      });
      throw new ForbiddenException('Insufficient permissions to access this branch');
    }

    console.log('Access Granted - Full Details:', {
      userRole,
      userOrganizationId: userOrgIdString,
      branchOrganizationId: branchOrgIdString,
      accessLevel: 'Full Access'
    });

    // Get branch admins for this branch
    console.log('=== BRANCH ADMIN QUERY DEBUG ===');
    console.log('Querying branch admins with details:', {
      branchId: id,
      branchIdType: typeof id,
      branchObjectId: new Types.ObjectId(id),
      userRole,
      userOrganizationId,
      userBranchId
    });

    const branchAdmins = await this.branchAdminModel
      .find({ 
        branchId: new Types.ObjectId(id), 
        isDeleted: { $ne: true } 
      })
      .select('firstName lastName email phone isActive createdAt branchId')
      .exec();

    console.log('Branch Admins Query Results:', {
      branchAdminsCount: branchAdmins.length,
      branchAdminsDetails: branchAdmins.map(admin => ({
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        isActive: admin.isActive,
        branchId: admin.branchId
      }))
    });
    
    // Use the most successful query
    const branchAdminsFinal = branchAdmins;
    
    console.log('Final result - Found branch admins:', branchAdminsFinal.length);
    console.log('================================');

    // Get staff counts
    const [doctorsCount, receptionistsCount, patientsCount] = await Promise.all([
      this.doctorModel.countDocuments({ branchId: id, isDeleted: { $ne: true } }).exec(),
      this.receptionistModel.countDocuments({ branchId: id, isDeleted: { $ne: true } }).exec(),
      this.patientModel.countDocuments({ branchId: id, isDeleted: { $ne: true } }).exec(),
    ]);

    // Return branch with additional data
    const branchWithDetails = {
      ...branch.toObject(),
      branchAdmins: branchAdminsFinal,
      totalDoctors: doctorsCount,
      totalReceptionists: receptionistsCount,
      totalPatients: patientsCount,
      totalStaff: doctorsCount + receptionistsCount
    };

    console.log('Branch with details:', { branchId: id, adminCount: branchAdminsFinal.length, totalStaff: branchWithDetails.totalStaff });
    return branchWithDetails;
  }

  async update(id: string, updateBranchDto: any, userRole: string, userOrganizationId?: string, userBranchId?: string): Promise<Branch | null> {
    console.log('BranchesService.update called:', { id, updateData: updateBranchDto, userRole, userOrganizationId });
    
    const branch = await this.branchModel.findById(id).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can update any branch
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (branch.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId === id) {
      // Branch admin can update their own branch
    } else {
    throw new ForbiddenException('Insufficient permissions');
  }

    const updatedBranch = await this.branchModel.findByIdAndUpdate(
      id, 
      updateBranchDto, 
      { new: true }
    ).exec();

    console.log('Branch updated:', updatedBranch?._id);
    return updatedBranch;
  }

  async remove(id: string, userRole: string, userOrganizationId?: string, reason?: string): Promise<Branch | null> {
    console.log('BranchesService.remove called:', { id, userRole, userOrganizationId, reason });
    
      const branch = await this.branchModel.findById(id).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can delete any branch
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (branch.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
    throw new ForbiddenException('Insufficient permissions');
  }

    // Soft delete the branch
    const updatedBranch = await this.branchModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedReason: reason || 'No reason provided'
      },
      { new: true }
    ).exec();

    console.log('Branch soft deleted:', updatedBranch?._id);
    return updatedBranch;
  }

  async restore(id: string, userRole: string, userOrganizationId?: string, reason?: string): Promise<Branch | null> {
    console.log('BranchesService.restore called:', { id, userRole, userOrganizationId, reason });
    
      const branch = await this.branchModel.findById(id).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can restore any branch
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (branch.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
    throw new ForbiddenException('Insufficient permissions');
    }

    // Restore the branch
    const restoredBranch = await this.branchModel.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedReason: null,
        restoredAt: new Date(),
        restoredReason: reason || 'No reason provided'
      },
      { new: true }
    ).exec();

    console.log('Branch restored:', restoredBranch?._id);
    return restoredBranch;
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

    console.log('Creating branch admin with data:', {
      ...createBranchAdminDto,
      branchId,
      organizationId,
      createdBy,
      password: '[HIDDEN]'
    });

    const branchAdmin = new this.branchAdminModel({
      ...createBranchAdminDto,
      password: hashedPassword,
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(createdBy),
      isDeleted: false, // Explicitly set to false
    });

    const savedAdmin = await branchAdmin.save();
    console.log('Branch admin saved successfully:', savedAdmin._id);
    return savedAdmin;
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

  // Debug methods
  async debugGetAllBranches(): Promise<any[]> {
    const branches = await this.branchModel
      .find({})
      .select('name organizationId createdBy isDeleted')
      .exec();
    
    return branches.map(branch => ({
      id: branch._id,
      name: branch.name,
      organizationId: branch.organizationId.toString(),
      createdBy: branch.createdBy.toString(),
      isDeleted: branch.isDeleted
    }));
  }

  async debugGetAllBranchAdmins(): Promise<any[]> {
    const admins = await this.branchAdminModel
      .find({})
      .select('firstName lastName email branchId organizationId isDeleted')
      .exec();
    
    return admins.map(admin => ({
      id: admin._id,
      name: `${admin.firstName} ${admin.lastName}`,
      email: admin.email,
      branchId: admin.branchId?.toString(),
      organizationId: admin.organizationId?.toString(),
      isDeleted: admin.isDeleted
    }));
  }
}
