import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { Receptionist, ReceptionistDocument } from '../../schemas/receptionist.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';

const saltRounds = 10;

export interface CreateReceptionistDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  employeeId?: string;
  languages?: string[];
  workingHours?: {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
  };
  permissions?: string[];
  experienceYears?: number;
  isActive?: boolean;
}

export interface UpdateReceptionistDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  employeeId?: string;
  languages?: string[];
  workingHours?: {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
  };
  permissions?: string[];
  experienceYears?: number;
  isActive?: boolean;
}

@Injectable()
export class ReceptionistsService {
  constructor(
    @InjectModel(Receptionist.name) private receptionistModel: Model<ReceptionistDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async create(
    createReceptionistDto: CreateReceptionistDto, 
    branchId: string,
    organizationId: string,
    createdBy: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Receptionist> {
    console.log('ReceptionistsService.create called:', { 
      branchId, 
      organizationId, 
      createdBy, 
      userRole,
      receptionistEmail: createReceptionistDto.email 
    });

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can create receptionists in any branch
    } else if (userRole === 'organization_admin' && userOrganizationId === organizationId) {
      // Organization admin can create receptionists in their organization's branches
    } else if (userRole === 'branch_admin' && userBranchId === branchId) {
      // Branch admin can create receptionists in their own branch
    } else {
      throw new ForbiddenException('Insufficient permissions to create receptionist');
    }

    // Check if branch exists
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if email already exists
    const existingReceptionist = await this.receptionistModel.findOne({ email: createReceptionistDto.email }).exec();
    if (existingReceptionist) {
      throw new ConflictException('Receptionist with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createReceptionistDto.password, saltRounds);

    // Create receptionist
    const receptionist = new this.receptionistModel({
      ...createReceptionistDto,
      password: hashedPassword,
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(createdBy),
      dateOfBirth: createReceptionistDto.dateOfBirth ? new Date(createReceptionistDto.dateOfBirth) : undefined,
      role: 'receptionist'
    });

    const savedReceptionist = await receptionist.save();
    console.log('Receptionist created successfully:', savedReceptionist._id);

    return savedReceptionist;
  }

  async findAll(
    branchId: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Receptionist[]> {
    console.log('ReceptionistsService.findAll called:', { branchId, userRole });

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can view all receptionists
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      // Organization admin can view receptionists in their organization's branches
      const branch = await this.branchModel.findById(branchId).exec();
      if (!branch || branch.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId === branchId) {
      // Branch admin can view receptionists in their own branch
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const receptionists = await this.receptionistModel
      .find({ 
        branchId: new Types.ObjectId(branchId), 
        isDeleted: { $ne: true } 
      })
      .populate('branchId', 'name')
      .populate('organizationId', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();

    console.log('Found receptionists:', receptionists.length);
    return receptionists;
  }

  async findOne(
    id: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Receptionist> {
    console.log('ReceptionistsService.findOne called:', { id, userRole });

    const receptionist = await this.receptionistModel
      .findById(id)
      .populate('branchId', 'name')
      .populate('organizationId', 'name')
      .select('-password')
      .exec();

    if (!receptionist || receptionist.isDeleted) {
      throw new NotFoundException('Receptionist not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can view any receptionist
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (receptionist.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (receptionist.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    return receptionist;
  }

  async update(
    id: string,
    updateReceptionistDto: UpdateReceptionistDto,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Receptionist> {
    console.log('ReceptionistsService.update called:', { id, userRole });

    const receptionist = await this.receptionistModel.findById(id).exec();
    if (!receptionist || receptionist.isDeleted) {
      throw new NotFoundException('Receptionist not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can update any receptionist
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (receptionist.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (receptionist.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Check email uniqueness if email is being updated
    if (updateReceptionistDto.email && updateReceptionistDto.email !== receptionist.email) {
      const existingReceptionist = await this.receptionistModel.findOne({ 
        email: updateReceptionistDto.email,
        _id: { $ne: id }
      }).exec();
      
      if (existingReceptionist) {
        throw new ConflictException('Receptionist with this email already exists');
      }
    }

    // Update receptionist
    const updatedReceptionist = await this.receptionistModel
      .findByIdAndUpdate(
        id,
        {
          ...updateReceptionistDto,
          dateOfBirth: updateReceptionistDto.dateOfBirth ? new Date(updateReceptionistDto.dateOfBirth) : receptionist.dateOfBirth
        },
        { new: true }
      )
      .populate('branchId', 'name')
      .populate('organizationId', 'name')
      .select('-password')
      .exec();

    console.log('Receptionist updated successfully:', updatedReceptionist?._id);
    return updatedReceptionist!;
  }

  async remove(
    id: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string,
    deletedBy?: string
  ): Promise<{ message: string }> {
    console.log('ReceptionistsService.remove called:', { id, userRole });

    const receptionist = await this.receptionistModel.findById(id).exec();
    if (!receptionist || receptionist.isDeleted) {
      throw new NotFoundException('Receptionist not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can delete any receptionist
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (receptionist.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (receptionist.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Soft delete
    await this.receptionistModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined
    }).exec();

    console.log('Receptionist soft deleted successfully:', id);
    return { message: 'Receptionist deleted successfully' };
  }

  async restore(
    id: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string,
    restoredBy?: string
  ): Promise<Receptionist> {
    console.log('ReceptionistsService.restore called:', { id, userRole });

    const receptionist = await this.receptionistModel.findById(id).exec();
    if (!receptionist) {
      throw new NotFoundException('Receptionist not found');
    }

    if (!receptionist.isDeleted) {
      throw new ConflictException('Receptionist is not deleted');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can restore any receptionist
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (receptionist.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (receptionist.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Restore receptionist
    const restoredReceptionist = await this.receptionistModel
      .findByIdAndUpdate(
        id,
        {
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          restoredAt: new Date(),
          restoredBy: restoredBy ? new Types.ObjectId(restoredBy) : undefined
        },
        { new: true }
      )
      .populate('branchId', 'name')
      .populate('organizationId', 'name')
      .select('-password')
      .exec();

    console.log('Receptionist restored successfully:', restoredReceptionist?._id);
    return restoredReceptionist!;
  }
}
