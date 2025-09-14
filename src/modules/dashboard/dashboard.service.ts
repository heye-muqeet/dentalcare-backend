import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../../schemas/organization.schema';
import { Branch, BranchDocument } from '../../schemas/branch.schema';
import { SuperAdmin, SuperAdminDocument } from '../../schemas/super-admin.schema';
import { OrganizationAdmin, OrganizationAdminDocument } from '../../schemas/organization-admin.schema';
import { BranchAdmin, BranchAdminDocument } from '../../schemas/branch-admin.schema';
import { Doctor, DoctorDocument } from '../../schemas/doctor.schema';
import { Receptionist, ReceptionistDocument } from '../../schemas/receptionist.schema';
import { Patient, PatientDocument } from '../../schemas/patient.schema';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
    @InjectModel(OrganizationAdmin.name) private organizationAdminModel: Model<OrganizationAdminDocument>,
    @InjectModel(BranchAdmin.name) private branchAdminModel: Model<BranchAdminDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Receptionist.name) private receptionistModel: Model<ReceptionistDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async getSystemStats(): Promise<any> {
    try {
      // Get counts for all entities
      const [
        totalOrganizations,
        totalBranches,
        totalSuperAdmins,
        totalOrganizationAdmins,
        totalBranchAdmins,
        totalDoctors,
        totalReceptionists,
        totalPatients,
        activeUsers,
        recentLogs
      ] = await Promise.all([
        this.organizationModel.countDocuments(),
        this.branchModel.countDocuments(),
        this.superAdminModel.countDocuments(),
        this.organizationAdminModel.countDocuments(),
        this.branchAdminModel.countDocuments(),
        this.doctorModel.countDocuments(),
        this.receptionistModel.countDocuments(),
        this.patientModel.countDocuments(),
        this.getActiveUsersCount(),
        this.auditLogModel.find().sort({ timestamp: -1 }).limit(10).exec()
      ]);

      const totalUsers = totalSuperAdmins + totalOrganizationAdmins + totalBranchAdmins + totalDoctors + totalReceptionists + totalPatients;

      // Calculate system uptime (mock for now)
      const systemUptime = '99.9%';
      
      // Calculate total revenue (mock for now - would need actual revenue data)
      const totalRevenue = 0;
      
      // Calculate monthly growth (mock for now)
      const monthlyGrowth = 0;

      return {
        totalOrganizations,
        totalBranches,
        totalUsers,
        totalDoctors,
        totalReceptionists,
        totalPatients,
        activeUsers,
        systemUptime,
        totalRevenue,
        monthlyGrowth,
        systemHealth: 'excellent'
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<any> {
    try {
      // Check database connectivity
      const dbStatus = await this.checkDatabaseHealth();
      
      return {
        status: dbStatus ? 'healthy' : 'degraded',
        services: {
          database: dbStatus ? 'up' : 'down',
          api: 'up',
          storage: 'up',
          email: 'up'
        },
        uptime: 99.9,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        status: 'unhealthy',
        services: {
          database: 'down',
          api: 'down',
          storage: 'down',
          email: 'down'
        },
        uptime: 0,
        lastCheck: new Date().toISOString()
      };
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.organizationModel.findOne().exec();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      const [
        activeSuperAdmins,
        activeOrganizationAdmins,
        activeBranchAdmins,
        activeDoctors,
        activeReceptionists,
        activePatients
      ] = await Promise.all([
        this.superAdminModel.countDocuments({ isActive: true }),
        this.organizationAdminModel.countDocuments({ isActive: true }),
        this.branchAdminModel.countDocuments({ isActive: true }),
        this.doctorModel.countDocuments({ isActive: true }),
        this.receptionistModel.countDocuments({ isActive: true }),
        this.patientModel.countDocuments({ isActive: true })
      ]);

      return activeSuperAdmins + activeOrganizationAdmins + activeBranchAdmins + 
             activeDoctors + activeReceptionists + activePatients;
    } catch (error) {
      console.error('Error counting active users:', error);
      return 0;
    }
  }

  async getOrganizationStats(organizationId: string): Promise<any> {
    try {
      const [
        totalBranches,
        totalOrganizationAdmins,
        totalBranchAdmins,
        totalDoctors,
        totalReceptionists,
        totalPatients,
        activeUsers
      ] = await Promise.all([
        this.branchModel.countDocuments({ organizationId }),
        this.organizationAdminModel.countDocuments({ organizationId }),
        this.branchAdminModel.countDocuments({ organizationId }),
        this.doctorModel.countDocuments({ organizationId }),
        this.receptionistModel.countDocuments({ organizationId }),
        this.patientModel.countDocuments({ organizationId }),
        this.getActiveUsersCountForOrganization(organizationId)
      ]);

      const totalUsers = totalOrganizationAdmins + totalBranchAdmins + totalDoctors + totalReceptionists + totalPatients;

      return {
        totalBranches,
        totalUsers,
        totalDoctors,
        totalReceptionists,
        totalPatients,
        monthlyRevenue: 0, // Would need actual revenue calculation
        activeUsers
      };
    } catch (error) {
      console.error('Error fetching organization stats:', error);
      throw error;
    }
  }

  async getAllSystemUsers(params: any = {}): Promise<any> {
    try {
      const { page = 1, limit = 50, role, organizationId, isActive } = params;
      const skip = (page - 1) * limit;

      // Build filter conditions
      const filters: any = {};
      if (role && role !== 'all') {
        filters.role = role;
      }
      if (organizationId) {
        filters.organizationId = organizationId;
      }
      if (isActive !== undefined) {
        filters.isActive = isActive;
      }

      // Get users from all role collections
      const [
        superAdmins,
        organizationAdmins,
        branchAdmins,
        doctors,
        receptionists,
        patients
      ] = await Promise.all([
        this.superAdminModel.find(filters).skip(skip).limit(limit).exec(),
        this.organizationAdminModel.find(filters).skip(skip).limit(limit).exec(),
        this.branchAdminModel.find(filters).skip(skip).limit(limit).exec(),
        this.doctorModel.find(filters).skip(skip).limit(limit).exec(),
        this.receptionistModel.find(filters).skip(skip).limit(limit).exec(),
        this.patientModel.find(filters).skip(skip).limit(limit).exec()
      ]);

      // Combine all users
      const allUsers = [
        ...superAdmins.map(user => ({ ...user.toObject(), role: 'super_admin' })),
        ...organizationAdmins.map(user => ({ ...user.toObject(), role: 'organization_admin' })),
        ...branchAdmins.map(user => ({ ...user.toObject(), role: 'branch_admin' })),
        ...doctors.map(user => ({ ...user.toObject(), role: 'doctor' })),
        ...receptionists.map(user => ({ ...user.toObject(), role: 'receptionist' })),
        ...patients.map(user => ({ ...user.toObject(), role: 'patient' }))
      ];

      // Get total count
      const totalCount = await this.getTotalUsersCount(filters);

      return {
        users: allUsers,
        total: totalCount,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching system users:', error);
      throw error;
    }
  }

  private async getActiveUsersCountForOrganization(organizationId: string): Promise<number> {
    try {
      const [
        activeOrganizationAdmins,
        activeBranchAdmins,
        activeDoctors,
        activeReceptionists,
        activePatients
      ] = await Promise.all([
        this.organizationAdminModel.countDocuments({ organizationId, isActive: true }),
        this.branchAdminModel.countDocuments({ organizationId, isActive: true }),
        this.doctorModel.countDocuments({ organizationId, isActive: true }),
        this.receptionistModel.countDocuments({ organizationId, isActive: true }),
        this.patientModel.countDocuments({ organizationId, isActive: true })
      ]);

      return activeOrganizationAdmins + activeBranchAdmins + activeDoctors + 
             activeReceptionists + activePatients;
    } catch (error) {
      console.error('Error counting active users for organization:', error);
      return 0;
    }
  }

  private async getTotalUsersCount(filters: any): Promise<number> {
    try {
      const [
        superAdminCount,
        organizationAdminCount,
        branchAdminCount,
        doctorCount,
        receptionistCount,
        patientCount
      ] = await Promise.all([
        this.superAdminModel.countDocuments(filters),
        this.organizationAdminModel.countDocuments(filters),
        this.branchAdminModel.countDocuments(filters),
        this.doctorModel.countDocuments(filters),
        this.receptionistModel.countDocuments(filters),
        this.patientModel.countDocuments(filters)
      ]);

      return superAdminCount + organizationAdminCount + branchAdminCount + 
             doctorCount + receptionistCount + patientCount;
    } catch (error) {
      console.error('Error counting total users:', error);
      return 0;
    }
  }
}
