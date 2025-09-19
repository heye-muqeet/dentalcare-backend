import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class SoftDeleteIndexMigration {
  private readonly logger = new Logger(SoftDeleteIndexMigration.name);

  constructor(@InjectConnection() private connection: Connection) {}

  async addSoftDeleteIndexes() {
    const collections = [
      'organizations',
      'branches', 
      'patients',
      'doctors',
      'superadmins',
      'organizationadmins',
      'branchadmins',
      'receptionists',
      'users'
    ];

    for (const collectionName of collections) {
      try {
        const collection = this.connection.collection(collectionName);
        
        // Add index on isDeleted for query performance
        await collection.createIndex(
          { isDeleted: 1 },
          { 
            name: 'idx_isDeleted',
            background: true,
            sparse: true 
          }
        );

        // Add compound index for organization-scoped queries
        await collection.createIndex(
          { organizationId: 1, isDeleted: 1 },
          { 
            name: 'idx_org_isDeleted',
            background: true,
            sparse: true 
          }
        );

        // Add compound index for branch-scoped queries  
        await collection.createIndex(
          { branchId: 1, isDeleted: 1 },
          { 
            name: 'idx_branch_isDeleted',
            background: true,
            sparse: true 
          }
        );

        // Add index on deletedAt for cleanup operations
        await collection.createIndex(
          { deletedAt: 1 },
          { 
            name: 'idx_deletedAt',
            background: true,
            sparse: true 
          }
        );

        this.logger.log(`Added soft delete indexes to ${collectionName}`);
      } catch (error) {
        this.logger.error(`Failed to add indexes to ${collectionName}:`, error);
      }
    }

    this.logger.log('Soft delete index migration completed');
  }

  async removeSoftDeleteIndexes() {
    const collections = [
      'organizations',
      'branches', 
      'patients',
      'doctors',
      'superadmins',
      'organizationadmins',
      'branchadmins',
      'receptionists',
      'users'
    ];

    for (const collectionName of collections) {
      try {
        const collection = this.connection.collection(collectionName);
        
        // Remove indexes
        await collection.dropIndex('idx_isDeleted');
        await collection.dropIndex('idx_org_isDeleted');
        await collection.dropIndex('idx_branch_isDeleted');
        await collection.dropIndex('idx_deletedAt');

        this.logger.log(`Removed soft delete indexes from ${collectionName}`);
      } catch (error) {
        this.logger.warn(`Some indexes may not exist in ${collectionName}:`, error.message);
      }
    }

    this.logger.log('Soft delete index removal completed');
  }
}
