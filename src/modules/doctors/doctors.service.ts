import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { Doctor, DoctorDocument } from '../../schemas/doctor.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';

const saltRounds = 10;

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  address?: string;
  dateOfBirth?: string;
  employeeId?: string;
  qualifications?: string[];
  experienceYears?: number;
  languages?: string[];
  consultationFee?: {
    amount: number;
    currency: string;
  };
  availability?: {
    monday: { start: string; end: string; isAvailable: boolean };
    tuesday: { start: string; end: string; isAvailable: boolean };
    wednesday: { start: string; end: string; isAvailable: boolean };
    thursday: { start: string; end: string; isAvailable: boolean };
    friday: { start: string; end: string; isAvailable: boolean };
    saturday: { start: string; end: string; isAvailable: boolean };
    sunday: { start: string; end: string; isAvailable: boolean };
  };
  services?: string[];
  isActive?: boolean;
}

export interface UpdateDoctorDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  address?: string;
  dateOfBirth?: string;
  employeeId?: string;
  qualifications?: string[];
  experienceYears?: number;
  languages?: string[];
  consultationFee?: {
    amount: number;
    currency: string;
  };
  availability?: {
    monday: { start: string; end: string; isAvailable: boolean };
    tuesday: { start: string; end: string; isAvailable: boolean };
    wednesday: { start: string; end: string; isAvailable: boolean };
    thursday: { start: string; end: string; isAvailable: boolean };
    friday: { start: string; end: string; isAvailable: boolean };
    saturday: { start: string; end: string; isAvailable: boolean };
    sunday: { start: string; end: string; isAvailable: boolean };
  };
  services?: string[];
  isActive?: boolean;
}

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async create(
    createDoctorDto: CreateDoctorDto, 
    branchId: string,
    organizationId: string,
    createdBy: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Doctor> {
    console.log('DoctorsService.create called:', { 
      branchId, 
      organizationId, 
      createdBy, 
      userRole,
      doctorEmail: createDoctorDto.email 
    });

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can create doctors in any branch
    } else if (userRole === 'organization_admin' && userOrganizationId === organizationId) {
      // Organization admin can create doctors in their organization's branches
    } else if (userRole === 'branch_admin' && userBranchId === branchId) {
      // Branch admin can create doctors in their own branch
    } else {
      throw new ForbiddenException('Insufficient permissions to create doctor');
    }

    // Check if branch exists
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if email already exists
    const existingDoctor = await this.doctorModel.findOne({ email: createDoctorDto.email }).exec();
    if (existingDoctor) {
      throw new ConflictException('Doctor with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createDoctorDto.password, saltRounds);

    // Create doctor
    const doctor = new this.doctorModel({
      ...createDoctorDto,
      password: hashedPassword,
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(createdBy),
      dateOfBirth: createDoctorDto.dateOfBirth ? new Date(createDoctorDto.dateOfBirth) : undefined,
      role: 'doctor'
    });

    const savedDoctor = await doctor.save();
    console.log('Doctor created successfully:', savedDoctor._id);

    return savedDoctor;
  }

  async findAll(
    branchId: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Doctor[]> {
    console.log('DoctorsService.findAll called:', { branchId, userRole });

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can view all doctors
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      // Organization admin can view doctors in their organization's branches
      const branch = await this.branchModel.findById(branchId).exec();
      if (!branch || branch.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId === branchId) {
      // Branch admin can view doctors in their own branch
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const doctors = await this.doctorModel
      .find({ 
        branchId: new Types.ObjectId(branchId), 
        isDeleted: { $ne: true } 
      })
      .populate('branchId', 'name')
      .populate('organizationId', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();

    console.log('Found doctors:', doctors.length);
    return doctors;
  }

  async findOne(
    id: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Doctor> {
    console.log('DoctorsService.findOne called:', { id, userRole });

    const doctor = await this.doctorModel
      .findById(id)
      .populate('branchId', 'name')
      .populate('organizationId', 'name')
      .select('-password')
      .exec();

    if (!doctor || doctor.isDeleted) {
      throw new NotFoundException('Doctor not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can view any doctor
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (doctor.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (doctor.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    return doctor;
  }

  async update(
    id: string,
    updateDoctorDto: UpdateDoctorDto,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string
  ): Promise<Doctor> {
    console.log('DoctorsService.update called:', { id, userRole });

    const doctor = await this.doctorModel.findById(id).exec();
    if (!doctor || doctor.isDeleted) {
      throw new NotFoundException('Doctor not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can update any doctor
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (doctor.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (doctor.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Check email uniqueness if email is being updated
    if (updateDoctorDto.email && updateDoctorDto.email !== doctor.email) {
      const existingDoctor = await this.doctorModel.findOne({ 
        email: updateDoctorDto.email,
        _id: { $ne: id }
      }).exec();
      
      if (existingDoctor) {
        throw new ConflictException('Doctor with this email already exists');
      }
    }

    // Update doctor
    const updatedDoctor = await this.doctorModel
      .findByIdAndUpdate(
        id,
        {
          ...updateDoctorDto,
          dateOfBirth: updateDoctorDto.dateOfBirth ? new Date(updateDoctorDto.dateOfBirth) : doctor.dateOfBirth
        },
        { new: true }
      )
      .populate('branchId', 'name')
      .populate('organizationId', 'name')
      .select('-password')
      .exec();

    console.log('Doctor updated successfully:', updatedDoctor?._id);
    return updatedDoctor!;
  }

  async remove(
    id: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string,
    deletedBy?: string
  ): Promise<{ message: string }> {
    console.log('DoctorsService.remove called:', { id, userRole });

    const doctor = await this.doctorModel.findById(id).exec();
    if (!doctor || doctor.isDeleted) {
      throw new NotFoundException('Doctor not found');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can delete any doctor
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (doctor.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (doctor.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Soft delete
    await this.doctorModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined
    }).exec();

    console.log('Doctor soft deleted successfully:', id);
    return { message: 'Doctor deleted successfully' };
  }

  async restore(
    id: string,
    userRole: string,
    userOrganizationId?: string,
    userBranchId?: string,
    restoredBy?: string
  ): Promise<Doctor> {
    console.log('DoctorsService.restore called:', { id, userRole });

    const doctor = await this.doctorModel.findById(id).exec();
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (!doctor.isDeleted) {
      throw new ConflictException('Doctor is not deleted');
    }

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can restore any doctor
    } else if (userRole === 'organization_admin' && userOrganizationId) {
      if (doctor.organizationId.toString() !== userOrganizationId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else if (userRole === 'branch_admin' && userBranchId) {
      if (doctor.branchId.toString() !== userBranchId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Restore doctor
    const restoredDoctor = await this.doctorModel
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

    console.log('Doctor restored successfully:', restoredDoctor?._id);
    return restoredDoctor!;
  }
}
