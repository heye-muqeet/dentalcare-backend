import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument, TokenStatus } from '../schemas/refresh-token.schema';
import { AuditLoggerService } from './audit-logger.service';
import { ActivityType, LogLevel } from '../schemas/audit-log.schema';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private auditLoggerService: AuditLoggerService,
  ) {}

  /**
   * Clean up expired and revoked tokens every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    try {
      this.logger.log('Starting token cleanup process...');
      
      const now = new Date();
      
      // Find and delete expired tokens
      const expiredResult = await this.refreshTokenModel.deleteMany({
        $or: [
          { expiresAt: { $lt: now } },
          { status: { $in: [TokenStatus.EXPIRED, TokenStatus.REVOKED] } }
        ]
      });

      // Find tokens that haven't been used for 30 days and are not remember me
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const unusedResult = await this.refreshTokenModel.deleteMany({
        lastUsedAt: { $lt: thirtyDaysAgo },
        isRememberMe: false,
        status: TokenStatus.ACTIVE
      });

      const totalCleaned = expiredResult.deletedCount + unusedResult.deletedCount;
      
      if (totalCleaned > 0) {
        this.logger.log(`Token cleanup completed: ${totalCleaned} tokens removed`);
        
        // Log cleanup activity
        await this.auditLoggerService.logSystemEvent(
          ActivityType.SYSTEM_STARTUP,
          `Token cleanup completed: ${totalCleaned} tokens removed`,
          {
            module: 'token-cleanup',
            service: 'TokenCleanupService',
            metadata: {
              expiredTokens: expiredResult.deletedCount,
              unusedTokens: unusedResult.deletedCount,
              totalCleaned,
              cleanupTime: now.toISOString()
            }
          }
        );
      }
    } catch (error) {
      this.logger.error('Token cleanup failed:', error);
      
      // Log cleanup error
      await this.auditLoggerService.logError(
        'Token cleanup process failed',
        error as Error,
        {
          module: 'token-cleanup',
          service: 'TokenCleanupService',
          metadata: {
            error: error.message,
            stack: error.stack
          }
        }
      );
    }
  }

  /**
   * Clean up old remember me tokens (keep only last 5 per user)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldRememberMeTokens() {
    try {
      this.logger.log('Starting remember me token cleanup...');
      
      // Get all users with remember me tokens
      const usersWithRememberMeTokens = await this.refreshTokenModel.aggregate([
        {
          $match: {
            isRememberMe: true,
            status: TokenStatus.ACTIVE
          }
        },
        {
          $group: {
            _id: '$userId',
            tokens: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gt: 5 } // More than 5 remember me tokens
          }
        }
      ]);

      let totalRevoked = 0;

      for (const userGroup of usersWithRememberMeTokens) {
        // Sort tokens by lastUsedAt (most recent first)
        const sortedTokens = userGroup.tokens.sort((a, b) => 
          new Date(b.lastUsedAt || b.createdAt).getTime() - 
          new Date(a.lastUsedAt || a.createdAt).getTime()
        );

        // Keep only the 5 most recent tokens
        const tokensToRevoke = sortedTokens.slice(5);
        const tokenIds = tokensToRevoke.map(token => token._id);

        if (tokenIds.length > 0) {
          const result = await this.refreshTokenModel.updateMany(
            { _id: { $in: tokenIds } },
            {
              status: TokenStatus.REVOKED,
              revokedBy: 'system',
              revokedReason: 'Max remember me tokens exceeded',
              revokedAt: new Date()
            }
          );

          totalRevoked += result.modifiedCount;
        }
      }

      if (totalRevoked > 0) {
        this.logger.log(`Remember me token cleanup completed: ${totalRevoked} tokens revoked`);
        
        // Log cleanup activity
        await this.auditLoggerService.logSystemEvent(
          ActivityType.SYSTEM_STARTUP,
          `Remember me token cleanup completed: ${totalRevoked} tokens revoked`,
          {
            module: 'token-cleanup',
            service: 'TokenCleanupService',
            metadata: {
              totalRevoked,
              usersProcessed: usersWithRememberMeTokens.length,
              cleanupTime: new Date().toISOString()
            }
          }
        );
      }
    } catch (error) {
      this.logger.error('Remember me token cleanup failed:', error);
      
      // Log cleanup error
      await this.auditLoggerService.logError(
        'Remember me token cleanup process failed',
        error as Error,
        {
          module: 'token-cleanup',
          service: 'TokenCleanupService',
          metadata: {
            error: error.message,
            stack: error.stack
          }
        }
      );
    }
  }

  /**
   * Get token cleanup statistics
   */
  async getCleanupStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const stats = await this.refreshTokenModel.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          activeTokens: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          expiredTokens: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          revokedTokens: {
            $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] }
          },
          rememberMeTokens: {
            $sum: { $cond: ['$isRememberMe', 1, 0] }
          },
          tokensExpiringSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $lt: ['$expiresAt', new Date(now.getTime() + (24 * 60 * 60 * 1000))] }
                  ]
                },
                1,
                0
              ]
            }
          },
          unusedTokens: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $lt: ['$lastUsedAt', thirtyDaysAgo] },
                    { $eq: ['$isRememberMe', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      revokedTokens: 0,
      rememberMeTokens: 0,
      tokensExpiringSoon: 0,
      unusedTokens: 0
    };
  }

  /**
   * Force cleanup of all expired tokens (manual trigger)
   */
  async forceCleanup(): Promise<{ success: boolean; cleanedCount: number }> {
    try {
      this.logger.log('Starting forced token cleanup...');
      
      const now = new Date();
      const result = await this.refreshTokenModel.deleteMany({
        $or: [
          { expiresAt: { $lt: now } },
          { status: { $in: [TokenStatus.EXPIRED, TokenStatus.REVOKED] } }
        ]
      });

      this.logger.log(`Forced cleanup completed: ${result.deletedCount} tokens removed`);
      
      // Log forced cleanup
      await this.auditLoggerService.logSystemEvent(
        ActivityType.SYSTEM_STARTUP,
        `Forced token cleanup completed: ${result.deletedCount} tokens removed`,
        {
          module: 'token-cleanup',
          service: 'TokenCleanupService',
          metadata: {
            cleanedCount: result.deletedCount,
            cleanupTime: now.toISOString(),
            triggeredBy: 'manual'
          }
        }
      );

      return {
        success: true,
        cleanedCount: result.deletedCount
      };
    } catch (error) {
      this.logger.error('Forced token cleanup failed:', error);
      
      // Log cleanup error
      await this.auditLoggerService.logError(
        'Forced token cleanup failed',
        error as Error,
        {
          module: 'token-cleanup',
          service: 'TokenCleanupService',
          metadata: {
            error: error.message,
            stack: error.stack
          }
        }
      );

      return {
        success: false,
        cleanedCount: 0
      };
    }
  }
}
