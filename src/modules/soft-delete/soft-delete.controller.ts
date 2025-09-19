import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SoftDeleteService } from '../../services/soft-delete.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  Organization, 
  OrganizationDocument 
} from '../../schemas/organization.schema';
import { 
  Branch, 
  BranchDocument 
} from '../../schemas/branch.schema';
import { 
  Patient, 
  PatientDocument 
} from '../../schemas/patient.schema';
import { 
  Doctor, 
  DoctorDocument 
} from '../../schemas/doctor.schema';
import { 
  BranchAdmin, 
  BranchAdminDocument 
} from '../../schemas/branch-admin.schema';
import { 
  OrganizationAdmin, 
  OrganizationAdminDocument 
} from '../../schemas/organization-admin.schema';
import { 
  Receptionist, 
  ReceptionistDocument 
} from '../../schemas/receptionist.schema';

interface SoftDeleteRequest {
  reason?: string;
  metadata?: Record<string, any>;
}

interface RestoreRequest {
  reason?: string;
  metadata?: Record<string, any>;
}

@Controller('soft-delete')
@UseGuards(JwtAuthGuard)
export class SoftDeleteController {
  private modelMap: Map<string, Model<any>>;

  constructor(
    private softDeleteService: SoftDeleteService,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(BranchAdmin.name) private branchAdminModel: Model<BranchAdminDocument>,
    @InjectModel(OrganizationAdmin.name) private organizationAdminModel: Model<OrganizationAdminDocument>,
    @InjectModel(Receptionist.name) private receptionistModel: Model<ReceptionistDocument>,
  ) {
    this.modelMap = new Map();
    this.modelMap.set('organization', this.organizationModel);
    this.modelMap.set('branch', this.branchModel);
    this.modelMap.set('patient', this.patientModel);
    this.modelMap.set('doctor', this.doctorModel);
    this.modelMap.set('branch-admin', this.branchAdminModel);
    this.modelMap.set('organization-admin', this.organizationAdminModel);
    this.modelMap.set('receptionist', this.receptionistModel);
  }

  /**
   * Soft delete a document
   */
  @Post(':modelType/:id/delete')
  async softDelete(
    @Param('modelType') modelType: string,
    @Param('id') id: string,
    @Body() body: SoftDeleteRequest,
    @Request() req: any
  ) {
    const model = this.getModel(modelType);
    
    const auditContext = {
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      organizationId: req.user.organizationId,
      branchId: req.user.branchId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await this.softDeleteService.softDelete(
      model,
      id,
      {
        deletedBy: req.user.userId,
        reason: body.reason,
        metadata: body.metadata
      },
      auditContext
    );

    return {
      success: true,
      message: `${modelType} soft deleted successfully`,
      data: result
    };
  }

  /**
   * Restore a soft deleted document
   */
  @Post(':modelType/:id/restore')
  async restore(
    @Param('modelType') modelType: string,
    @Param('id') id: string,
    @Body() body: RestoreRequest,
    @Request() req: any
  ) {
    const model = this.getModel(modelType);
    
    const auditContext = {
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      organizationId: req.user.organizationId,
      branchId: req.user.branchId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await this.softDeleteService.restore(
      model,
      id,
      {
        restoredBy: req.user.userId,
        reason: body.reason,
        metadata: body.metadata
      },
      auditContext
    );

    return {
      success: true,
      message: `${modelType} restored successfully`,
      data: result
    };
  }

  /**
   * Permanently delete a document
   */
  @Post(':modelType/:id/permanent-delete')
  async permanentDelete(
    @Param('modelType') modelType: string,
    @Param('id') id: string,
    @Request() req: any
  ) {
    // Only super admins can permanently delete
    if (req.user.role !== 'super_admin') {
      throw new BadRequestException('Only super admins can permanently delete records');
    }

    const model = this.getModel(modelType);
    
    const auditContext = {
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      organizationId: req.user.organizationId,
      branchId: req.user.branchId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await this.softDeleteService.permanentDelete(
      model,
      id,
      auditContext
    );

    return {
      success: true,
      message: `${modelType} permanently deleted`,
      data: result
    };
  }

  /**
   * Get soft delete statistics
   */
  @Get(':modelType/stats')
  async getDeleteStats(
    @Param('modelType') modelType: string,
    @Request() req: any,
    @Query('organizationId') organizationId?: string,
    @Query('branchId') branchId?: string
  ) {
    const model = this.getModel(modelType);
    
    // Use user's context if not provided and user is not super admin
    if (req.user.role !== 'super_admin') {
      organizationId = organizationId || req.user.organizationId;
      branchId = branchId || req.user.branchId;
    }

    const stats = await this.softDeleteService.getDeleteStats(
      model,
      organizationId,
      branchId
    );

    return {
      success: true,
      data: {
        modelType,
        organizationId,
        branchId,
        ...stats
      }
    };
  }

  /**
   * Get soft deleted documents
   */
  @Get(':modelType/deleted')
  async getDeleted(
    @Param('modelType') modelType: string,
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('organizationId') organizationId?: string,
    @Query('branchId') branchId?: string
  ) {
    const model = this.getModel(modelType);
    
    // Use user's context if not provided and user is not super admin
    if (req.user.role !== 'super_admin') {
      organizationId = organizationId || req.user.organizationId;
      branchId = branchId || req.user.branchId;
    }

    const baseFilter: any = {};
    if (organizationId) baseFilter.organizationId = organizationId;
    if (branchId) baseFilter.branchId = branchId;

    const filter = this.softDeleteService.buildSoftDeleteFilter(
      baseFilter,
      { deletedOnly: true }
    );

    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      model.find(filter)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('deletedBy', 'firstName lastName email'),
      model.countDocuments(filter)
    ]);

    return {
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  /**
   * Cleanup old deleted documents
   */
  @Post(':modelType/cleanup')
  async cleanup(
    @Param('modelType') modelType: string,
    @Query('daysOld') daysOld: number = 90,
    @Query('batchSize') batchSize: number = 100,
    @Request() req: any
  ) {
    // Only super admins can cleanup
    if (req.user.role !== 'super_admin') {
      throw new BadRequestException('Only super admins can cleanup old records');
    }

    const model = this.getModel(modelType);
    
    const deletedCount = await this.softDeleteService.cleanupOldDeletedDocuments(
      model,
      daysOld,
      batchSize
    );

    return {
      success: true,
      message: `Cleanup completed for ${modelType}`,
      data: {
        deletedCount,
        daysOld,
        batchSize
      }
    };
  }

  private getModel(modelType: string): Model<any> {
    const model = this.modelMap.get(modelType);
    if (!model) {
      throw new BadRequestException(`Invalid model type: ${modelType}`);
    }
    return model;
  }
}
