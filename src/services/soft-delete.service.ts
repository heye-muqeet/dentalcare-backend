import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Model, Document, Types, FilterQuery, UpdateQuery } from 'mongoose';
import { 
  SoftDeleteDocument, 
  SoftDeleteOptions, 
  RestoreOptions, 
  SoftDeleteQueryOptions 
} from '../schemas/base/soft-delete.schema';
import { AuditLoggerService } from './audit-logger.service';
import { ActivityType, UserRole } from '../schemas/audit-log.schema';

@Injectable()
export class SoftDeleteService {
  private readonly logger = new Logger(SoftDeleteService.name);

  constructor(private auditLoggerService: AuditLoggerService) {}

  /**
   * Soft delete a single document
   */
  async softDelete<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string | Types.ObjectId,
    options: SoftDeleteOptions = {},
    auditContext?: {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
      organizationId?: string;
      branchId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<T | null> {
    const document = await model.findById(id);
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (document.isDeleted && !options.permanent) {
      throw new BadRequestException('Document is already deleted');
    }

    const now = new Date();
    const updateData: UpdateQuery<T> = {
      isDeleted: true,
      deletedAt: now,
      deletedBy: options.deletedBy ? new Types.ObjectId(options.deletedBy.toString()) : undefined,
      deletedReason: options.reason,
      deletedMetadata: options.metadata
    };

    const updatedDocument = await model.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Log the soft delete operation
    if (auditContext) {
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_DELETED,
        `Document soft deleted: ${model.modelName} ${id}`,
        {
          userId: auditContext.userId,
          userEmail: auditContext.userEmail,
          userRole: auditContext.userRole,
          organizationId: auditContext.organizationId,
          branchId: auditContext.branchId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            modelName: model.modelName,
            documentId: id.toString(),
            deletedReason: options.reason,
            deletedMetadata: options.metadata,
            operationType: 'soft_delete'
          }
        }
      );
    }

    this.logger.log(`Soft deleted ${model.modelName} document: ${id}`);
    return updatedDocument;
  }

  /**
   * Soft delete multiple documents
   */
  async softDeleteMany<T extends SoftDeleteDocument>(
    model: Model<T>,
    filter: FilterQuery<T>,
    options: SoftDeleteOptions = {},
    auditContext?: {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
      organizationId?: string;
      branchId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ deletedCount: number }> {
    // First, get the documents that will be deleted for audit purposes
    const documentsToDelete = await model.find({ ...filter, isDeleted: false });
    
    const now = new Date();
    const updateData: UpdateQuery<T> = {
      isDeleted: true,
      deletedAt: now,
      deletedBy: options.deletedBy ? new Types.ObjectId(options.deletedBy.toString()) : undefined,
      deletedReason: options.reason,
      deletedMetadata: options.metadata
    };

    const result = await model.updateMany(
      { ...filter, isDeleted: false },
      updateData
    );

    // Log the bulk soft delete operation
    if (auditContext && result.modifiedCount > 0) {
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_DELETED,
        `Bulk soft delete: ${result.modifiedCount} ${model.modelName} documents`,
        {
          userId: auditContext.userId,
          userEmail: auditContext.userEmail,
          userRole: auditContext.userRole,
          organizationId: auditContext.organizationId,
          branchId: auditContext.branchId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            modelName: model.modelName,
            deletedCount: result.modifiedCount,
            deletedReason: options.reason,
            deletedMetadata: options.metadata,
            operationType: 'bulk_soft_delete',
            documentIds: documentsToDelete.map(doc => (doc as any)._id.toString())
          }
        }
      );
    }

    this.logger.log(`Soft deleted ${result.modifiedCount} ${model.modelName} documents`);
    return { deletedCount: result.modifiedCount };
  }

  /**
   * Restore a soft deleted document
   */
  async restore<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string | Types.ObjectId,
    options: RestoreOptions = {},
    auditContext?: {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
      organizationId?: string;
      branchId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<T | null> {
    const document = await model.findById(id);
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (!document.isDeleted) {
      throw new BadRequestException('Document is not deleted');
    }

    const updateData: UpdateQuery<T> = {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletedReason: undefined,
      deletedMetadata: undefined
    };

    const restoredDocument = await model.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Log the restore operation
    if (auditContext) {
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_UPDATED,
        `Document restored: ${model.modelName} ${id}`,
        {
          userId: auditContext.userId,
          userEmail: auditContext.userEmail,
          userRole: auditContext.userRole,
          organizationId: auditContext.organizationId,
          branchId: auditContext.branchId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            modelName: model.modelName,
            documentId: id.toString(),
            restoreReason: options.reason,
            restoreMetadata: options.metadata,
            operationType: 'restore'
          }
        }
      );
    }

    this.logger.log(`Restored ${model.modelName} document: ${id}`);
    return restoredDocument;
  }

  /**
   * Permanently delete a document (hard delete)
   */
  async permanentDelete<T extends SoftDeleteDocument>(
    model: Model<T>,
    id: string | Types.ObjectId,
    auditContext?: {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
      organizationId?: string;
      branchId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<T | null> {
    const document = await model.findById(id);
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Store document data for audit log before deletion
    const documentData = document.toObject();
    
    const deletedDocument = await model.findByIdAndDelete(id);

    // Log the permanent delete operation
    if (auditContext) {
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_DELETED,
        `Document permanently deleted: ${model.modelName} ${id}`,
        {
          userId: auditContext.userId,
          userEmail: auditContext.userEmail,
          userRole: auditContext.userRole,
          organizationId: auditContext.organizationId,
          branchId: auditContext.branchId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            modelName: model.modelName,
            documentId: id.toString(),
            operationType: 'permanent_delete',
            deletedDocument: documentData
          }
        }
      );
    }

    this.logger.warn(`Permanently deleted ${model.modelName} document: ${id}`);
    return deletedDocument;
  }

  /**
   * Find documents with soft delete filtering
   */
  buildSoftDeleteFilter<T>(
    baseFilter: FilterQuery<T>,
    options: SoftDeleteQueryOptions = {}
  ): FilterQuery<T & SoftDeleteDocument> {
    const filter = { ...baseFilter } as FilterQuery<T & SoftDeleteDocument>;

    if (options.deletedOnly) {
      filter.isDeleted = true;
    } else if (!options.includeDeleted) {
      filter.isDeleted = { $ne: true };
    }

    return filter;
  }

  /**
   * Get soft delete statistics for a model
   */
  async getDeleteStats<T extends SoftDeleteDocument>(
    model: Model<T>,
    organizationId?: string,
    branchId?: string
  ): Promise<{
    total: number;
    active: number;
    deleted: number;
    deletedToday: number;
    deletedThisWeek: number;
    deletedThisMonth: number;
  }> {
    const baseFilter: FilterQuery<T> = {};
    if (organizationId) (baseFilter as any).organizationId = organizationId;
    if (branchId) (baseFilter as any).branchId = branchId;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, active, deleted, deletedToday, deletedThisWeek, deletedThisMonth] = await Promise.all([
      model.countDocuments(baseFilter),
      model.countDocuments({ ...baseFilter, isDeleted: { $ne: true } }),
      model.countDocuments({ ...baseFilter, isDeleted: true }),
      model.countDocuments({ ...baseFilter, isDeleted: true, deletedAt: { $gte: todayStart } }),
      model.countDocuments({ ...baseFilter, isDeleted: true, deletedAt: { $gte: weekStart } }),
      model.countDocuments({ ...baseFilter, isDeleted: true, deletedAt: { $gte: monthStart } })
    ]);

    return {
      total,
      active,
      deleted,
      deletedToday,
      deletedThisWeek,
      deletedThisMonth
    };
  }

  /**
   * Cascade soft delete - delete related documents when parent is deleted
   */
  async cascadeSoftDelete<T extends SoftDeleteDocument>(
    parentModel: Model<T>,
    parentId: string | Types.ObjectId,
    cascadeRules: Array<{
      model: Model<any>;
      foreignKey: string;
      modelName: string;
    }>,
    options: SoftDeleteOptions = {},
    auditContext?: {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
      organizationId?: string;
      branchId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{
    parent: T | null;
    cascaded: Array<{ modelName: string; deletedCount: number; documents: any[] }>;
  }> {
    // First, soft delete the parent
    const parent = await this.softDelete(parentModel, parentId, options, auditContext);
    
    if (!parent) {
      throw new NotFoundException(`Parent document with ID ${parentId} not found`);
    }

    const cascadeResults: Array<{ modelName: string; deletedCount: number; documents: any[] }> = [];

    // Then cascade to related documents
    for (const rule of cascadeRules) {
      try {
        // Find documents that reference the parent
        const relatedDocuments = await rule.model.find({
          [rule.foreignKey]: parentId,
          isDeleted: { $ne: true }
        });

        if (relatedDocuments.length > 0) {
          // Soft delete all related documents
          const cascadeOptions: SoftDeleteOptions = {
            deletedBy: options.deletedBy,
            reason: options.reason || `Cascade delete from ${parentModel.modelName}`,
            metadata: {
              ...options.metadata,
              cascadeFrom: {
                modelName: parentModel.modelName,
                documentId: parentId.toString(),
                reason: 'cascade_delete'
              }
            }
          };

          const result = await this.softDeleteMany(
            rule.model,
            { [rule.foreignKey]: parentId },
            cascadeOptions,
            auditContext
          );

          cascadeResults.push({
            modelName: rule.modelName,
            deletedCount: result.deletedCount,
            documents: relatedDocuments.map(doc => ({
              id: (doc as any)._id,
              [rule.foreignKey]: (doc as any)[rule.foreignKey]
            }))
          });

          this.logger.log(`Cascade deleted ${result.deletedCount} ${rule.modelName} documents`);
        }
      } catch (error) {
        this.logger.error(`Failed to cascade delete ${rule.modelName}:`, error);
        // Continue with other cascade rules even if one fails
      }
    }

    // Log the cascade operation
    if (auditContext) {
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_DELETED,
        `Cascade soft delete completed for ${parentModel.modelName} ${parentId}`,
        {
          userId: auditContext.userId,
          userEmail: auditContext.userEmail,
          userRole: auditContext.userRole,
          organizationId: auditContext.organizationId,
          branchId: auditContext.branchId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            parentModelName: parentModel.modelName,
            parentDocumentId: parentId.toString(),
            cascadeResults,
            operationType: 'cascade_soft_delete',
            totalCascadedDocuments: cascadeResults.reduce((sum, result) => sum + result.deletedCount, 0)
          }
        }
      );
    }

    return {
      parent,
      cascaded: cascadeResults
    };
  }

  /**
   * Cascade restore - restore related documents when parent is restored
   */
  async cascadeRestore<T extends SoftDeleteDocument>(
    parentModel: Model<T>,
    parentId: string | Types.ObjectId,
    cascadeRules: Array<{
      model: Model<any>;
      foreignKey: string;
      modelName: string;
    }>,
    options: RestoreOptions = {},
    auditContext?: {
      userId?: string;
      userEmail?: string;
      userRole?: UserRole;
      organizationId?: string;
      branchId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{
    parent: T | null;
    cascaded: Array<{ modelName: string; restoredCount: number; documents: any[] }>;
  }> {
    // First, restore the parent
    const parent = await this.restore(parentModel, parentId, options, auditContext);
    
    if (!parent) {
      throw new NotFoundException(`Parent document with ID ${parentId} not found`);
    }

    const cascadeResults: Array<{ modelName: string; restoredCount: number; documents: any[] }> = [];

    // Then cascade restore to related documents that were deleted as part of cascade
    for (const rule of cascadeRules) {
      try {
        // Find soft deleted documents that were cascade deleted from this parent
        const relatedDocuments = await rule.model.find({
          [rule.foreignKey]: parentId,
          isDeleted: true,
          'deletedMetadata.cascadeFrom.documentId': parentId.toString(),
          'deletedMetadata.cascadeFrom.modelName': parentModel.modelName
        });

        let restoredCount = 0;
        const restoredDocuments: any[] = [];

        for (const doc of relatedDocuments) {
          try {
            const restored = await this.restore(
              rule.model,
              doc._id,
              {
                restoredBy: options.restoredBy,
                reason: options.reason || `Cascade restore from ${parentModel.modelName}`,
                metadata: {
                  ...options.metadata,
                  cascadeFrom: {
                    modelName: parentModel.modelName,
                    documentId: parentId.toString(),
                    reason: 'cascade_restore'
                  }
                }
              },
              auditContext
            );

            if (restored) {
              restoredCount++;
              restoredDocuments.push({
                id: doc._id,
                [rule.foreignKey]: doc[rule.foreignKey]
              });
            }
          } catch (error) {
            this.logger.error(`Failed to restore ${rule.modelName} document ${doc._id}:`, error);
          }
        }

        if (restoredCount > 0) {
          cascadeResults.push({
            modelName: rule.modelName,
            restoredCount,
            documents: restoredDocuments
          });

          this.logger.log(`Cascade restored ${restoredCount} ${rule.modelName} documents`);
        }
      } catch (error) {
        this.logger.error(`Failed to cascade restore ${rule.modelName}:`, error);
      }
    }

    // Log the cascade restore operation
    if (auditContext) {
      await this.auditLoggerService.logUserEvent(
        ActivityType.USER_UPDATED,
        `Cascade restore completed for ${parentModel.modelName} ${parentId}`,
        {
          userId: auditContext.userId,
          userEmail: auditContext.userEmail,
          userRole: auditContext.userRole,
          organizationId: auditContext.organizationId,
          branchId: auditContext.branchId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            parentModelName: parentModel.modelName,
            parentDocumentId: parentId.toString(),
            cascadeResults,
            operationType: 'cascade_restore',
            totalRestoredDocuments: cascadeResults.reduce((sum, result) => sum + result.restoredCount, 0)
          }
        }
      );
    }

    return {
      parent,
      cascaded: cascadeResults
    };
  }

  /**
   * Clean up old soft deleted documents
   */
  async cleanupOldDeletedDocuments<T extends SoftDeleteDocument>(
    model: Model<T>,
    daysOld: number = 90,
    batchSize: number = 100
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const documentsToDelete = await model.find({
        isDeleted: true,
        deletedAt: { $lt: cutoffDate }
      }).limit(batchSize);

      if (documentsToDelete.length === 0) {
        hasMore = false;
        break;
      }

      const ids = documentsToDelete.map(doc => doc._id);
      const result = await model.deleteMany({ _id: { $in: ids } });
      
      totalDeleted += result.deletedCount;
      
      this.logger.log(`Cleaned up ${result.deletedCount} old ${model.modelName} documents`);
      
      if (documentsToDelete.length < batchSize) {
        hasMore = false;
      }
    }

    this.logger.log(`Total cleanup: ${totalDeleted} old ${model.modelName} documents permanently deleted`);
    return totalDeleted;
  }
}
