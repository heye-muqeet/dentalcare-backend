import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { SuperAdmin, SuperAdminDocument } from '../schemas/super-admin.schema';
import { OrganizationAdmin, OrganizationAdminDocument } from '../schemas/organization-admin.schema';
import { BranchAdmin, BranchAdminDocument } from '../schemas/branch-admin.schema';
import { Doctor, DoctorDocument } from '../schemas/doctor.schema';
import { Receptionist, ReceptionistDocument } from '../schemas/receptionist.schema';
import { Patient, PatientDocument } from '../schemas/patient.schema';
import { AuditLoggerService } from '../services/audit-logger.service';
import { TokenService, TokenPair } from '../services/token.service';
import { ActivityType, LogLevel, UserRole } from '../schemas/audit-log.schema';

export interface LoginResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  role: string;
  organizationId?: string;
  branchId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
    @InjectModel(OrganizationAdmin.name) private orgAdminModel: Model<OrganizationAdminDocument>,
    @InjectModel(BranchAdmin.name) private branchAdminModel: Model<BranchAdminDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Receptionist.name) private receptionistModel: Model<ReceptionistDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    public auditLoggerService: AuditLoggerService,
    private tokenService: TokenService,
  ) {}

  async validateUser(email: string, password: string, role: string): Promise<any> {
    let user: any = null;

    switch (role) {
      case 'super_admin':
        user = await this.superAdminModel.findOne({ email }).exec();
        break;
      case 'organization_admin':
        user = await this.orgAdminModel.findOne({ email }).populate('organizationId').exec();
        break;
      case 'branch_admin':
        user = await this.branchAdminModel.findOne({ email }).populate('branchId organizationId').exec();
        break;
      case 'doctor':
        user = await this.doctorModel.findOne({ email }).populate('branchId organizationId').exec();
        break;
      case 'receptionist':
        user = await this.receptionistModel.findOne({ email }).populate('branchId organizationId').exec();
        break;
      case 'patient':
        user = await this.patientModel.findOne({ email }).populate('branchId organizationId').exec();
        break;
      default:
        throw new UnauthorizedException('Invalid role');
    }

    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any, role: string, context?: any): Promise<LoginResponse> {
    // Generate token pair using token service
    const tokenPair = await this.tokenService.generateTokenPair(user, {
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      deviceId: context?.deviceId,
      deviceName: context?.deviceName,
      isRememberMe: context?.isRememberMe
    });

    const loginResponse = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: role,
        organizationId: user.organizationId,
        branchId: user.branchId,
        profileImage: user.profileImage,
        isActive: user.isActive,
      },
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      expires_in: tokenPair.expiresIn,
      token_type: tokenPair.tokenType,
      role: role,
      organizationId: user.organizationId,
      branchId: user.branchId,
    };

    // Log successful login
    await this.auditLoggerService.logAuthEvent(
      ActivityType.LOGIN,
      `User ${user.email} logged in successfully`,
      {
        userId: user._id.toString(),
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: role as UserRole,
        organizationId: user.organizationId?.toString(),
        branchId: user.branchId?.toString(),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        requestId: context?.requestId,
        endpoint: '/auth/login',
        method: 'POST',
        metadata: {
          loginTime: new Date().toISOString(),
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress,
          deviceId: context?.deviceId,
          deviceName: context?.deviceName,
          isRememberMe: context?.isRememberMe
        }
      }
    );

    return loginResponse;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async createSuperAdmin(createSuperAdminDto: any): Promise<SuperAdmin> {
    const existingAdmin = await this.superAdminModel.findOne({ email: createSuperAdminDto.email }).exec();
    if (existingAdmin) {
      throw new ConflictException('Super Admin with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createSuperAdminDto.password);
    const superAdmin = new this.superAdminModel({
      ...createSuperAdminDto,
      password: hashedPassword,
    });

    return superAdmin.save();
  }

  async createOrganizationAdmin(createOrgAdminDto: any): Promise<OrganizationAdmin> {
    const existingAdmin = await this.orgAdminModel.findOne({ email: createOrgAdminDto.email }).exec();
    if (existingAdmin) {
      throw new ConflictException('Organization Admin with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createOrgAdminDto.password);
    const orgAdmin = new this.orgAdminModel({
      ...createOrgAdminDto,
      password: hashedPassword,
    });

    return orgAdmin.save();
  }

  async createBranchAdmin(createBranchAdminDto: any): Promise<BranchAdmin> {
    const existingAdmin = await this.branchAdminModel.findOne({ email: createBranchAdminDto.email }).exec();
    if (existingAdmin) {
      throw new ConflictException('Branch Admin with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createBranchAdminDto.password);
    const branchAdmin = new this.branchAdminModel({
      ...createBranchAdminDto,
      password: hashedPassword,
    });

    return branchAdmin.save();
  }

  async createDoctor(createDoctorDto: any): Promise<Doctor> {
    const existingDoctor = await this.doctorModel.findOne({ email: createDoctorDto.email }).exec();
    if (existingDoctor) {
      throw new ConflictException('Doctor with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createDoctorDto.password);
    const doctor = new this.doctorModel({
      ...createDoctorDto,
      password: hashedPassword,
    });

    return doctor.save();
  }

  async createReceptionist(createReceptionistDto: any): Promise<Receptionist> {
    const existingReceptionist = await this.receptionistModel.findOne({ email: createReceptionistDto.email }).exec();
    if (existingReceptionist) {
      throw new ConflictException('Receptionist with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createReceptionistDto.password);
    const receptionist = new this.receptionistModel({
      ...createReceptionistDto,
      password: hashedPassword,
    });

    return receptionist.save();
  }

  async createPatient(createPatientDto: any): Promise<Patient> {
    const existingPatient = await this.patientModel.findOne({ email: createPatientDto.email }).exec();
    if (existingPatient) {
      throw new ConflictException('Patient with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createPatientDto.password);
    const patient = new this.patientModel({
      ...createPatientDto,
      password: hashedPassword,
    });

    return patient.save();
  }
}
