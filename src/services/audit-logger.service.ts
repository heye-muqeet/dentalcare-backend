import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument, LogLevel, ActivityType, UserRole } from '../schemas/audit-log.schema';

export interface LogContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: UserRole;
  organizationId?: string;
  organizationName?: string;
  branchId?: string;
  branchName?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  metadata?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  isSecurityEvent?: boolean;
  securityLevel?: string;
  module?: string;
  service?: string;
  version?: string;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Log an activity with full context
   */
  async logActivity(
    level: LogLevel,
    activityType: ActivityType,
    message: string,
    description: string,
    context: LogContext = {},
  ): Promise<AuditLogDocument> {
    try {
      // Create searchable text for better querying
      const searchableText = this.createSearchableText(message, description, context);

      // Set expiration date based on log level
      const expiresAt = this.calculateExpirationDate(level);

      const auditLog = new this.auditLogModel({
        level,
        activityType,
        message,
        description,
        searchableText,
        expiresAt,
        ...context,
      });

      const savedLog = await auditLog.save();
      
      // Log to console for development
      this.logToConsole(level, message, context);
      
      return savedLog;
    } catch (error) {
      this.logger.error('Failed to save audit log', error);
      throw error;
    }
  }

  /**
   * Log user authentication events
   */
  async logAuthEvent(
    activityType: ActivityType,
    message: string,
    context: LogContext,
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.INFO,
      activityType,
      message,
      `User authentication event: ${message}`,
      { ...context, isSecurityEvent: true, securityLevel: 'high' }
    );
  }

  /**
   * Log user management events
   */
  async logUserEvent(
    activityType: ActivityType,
    message: string,
    context: LogContext,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.INFO,
      activityType,
      message,
      `User management event: ${message}`,
      { ...context, oldValues, newValues }
    );
  }

  /**
   * Log organization management events
   */
  async logOrganizationEvent(
    activityType: ActivityType,
    message: string,
    context: LogContext,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.INFO,
      activityType,
      message,
      `Organization management event: ${message}`,
      { ...context, oldValues, newValues }
    );
  }

  /**
   * Log branch management events
   */
  async logBranchEvent(
    activityType: ActivityType,
    message: string,
    context: LogContext,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.INFO,
      activityType,
      message,
      `Branch management event: ${message}`,
      { ...context, oldValues, newValues }
    );
  }

  /**
   * Log file management events
   */
  async logFileEvent(
    activityType: ActivityType,
    message: string,
    context: LogContext,
    metadata?: Record<string, any>,
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.INFO,
      activityType,
      message,
      `File management event: ${message}`,
      { ...context, metadata }
    );
  }

  /**
   * Log API access events
   */
  async logApiAccess(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    context: LogContext,
  ): Promise<AuditLogDocument> {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API ${method} ${endpoint} - ${statusCode}`;
    
    return this.logActivity(
      level,
      ActivityType.API_ACCESS,
      message,
      `API access: ${method} ${endpoint} returned ${statusCode} in ${responseTime}ms`,
      { ...context, endpoint, method, statusCode, responseTime }
    );
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    activityType: ActivityType,
    message: string,
    context: LogContext,
    securityLevel: string = 'high',
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.WARN,
      activityType,
      message,
      `Security event: ${message}`,
      { ...context, isSecurityEvent: true, securityLevel }
    );
  }

  /**
   * Log system events
   */
  async logSystemEvent(
    activityType: ActivityType,
    message: string,
    context: LogContext = {},
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.INFO,
      activityType,
      message,
      `System event: ${message}`,
      { ...context, userRole: UserRole.SYSTEM }
    );
  }

  /**
   * Log errors with full context
   */
  async logError(
    message: string,
    error: Error,
    context: LogContext,
  ): Promise<AuditLogDocument> {
    return this.logActivity(
      LogLevel.ERROR,
      ActivityType.API_ERROR,
      message,
      `Error: ${error.message}`,
      { 
        ...context, 
        metadata: { 
          errorStack: error.stack,
          errorName: error.name 
        } 
      }
    );
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    activityType?: ActivityType;
    level?: LogLevel;
    organizationId?: string;
    branchId?: string;
    startDate?: Date;
    endDate?: Date;
    isSecurityEvent?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const query: any = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.activityType) query.activityType = filters.activityType;
    if (filters.level) query.level = filters.level;
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.isSecurityEvent !== undefined) query.isSecurityEvent = filters.isSecurityEvent;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    return this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(organizationId?: string, branchId?: string) {
    const matchQuery: any = {};
    if (organizationId) matchQuery.organizationId = organizationId;
    if (branchId) matchQuery.branchId = branchId;

    const stats = await this.auditLogModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          errorLogs: {
            $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] }
          },
          securityEvents: {
            $sum: { $cond: ['$isSecurityEvent', 1, 0] }
          },
          uniqueUsers: { $addToSet: '$userId' },
          activitiesByType: {
            $push: {
              type: '$activityType',
              timestamp: '$timestamp'
            }
          }
        }
      },
      {
        $project: {
          totalLogs: 1,
          errorLogs: 1,
          securityEvents: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          activitiesByType: 1
        }
      }
    ]);

    return stats[0] || {
      totalLogs: 0,
      errorLogs: 0,
      securityEvents: 0,
      uniqueUserCount: 0,
      activitiesByType: []
    };
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanupOldLogs(): Promise<number> {
    const result = await this.auditLogModel.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    this.logger.log(`Cleaned up ${result.deletedCount} expired audit logs`);
    return result.deletedCount;
  }

  /**
   * Create searchable text for better querying
   */
  private createSearchableText(message: string, description: string, context: LogContext): string {
    const parts = [message, description];
    
    if (context.userName) parts.push(context.userName);
    if (context.userEmail) parts.push(context.userEmail);
    if (context.organizationName) parts.push(context.organizationName);
    if (context.branchName) parts.push(context.branchName);
    if (context.endpoint) parts.push(context.endpoint);
    
    return parts.join(' ').toLowerCase();
  }

  /**
   * Calculate expiration date based on log level
   */
  private calculateExpirationDate(level: LogLevel): Date {
    const now = new Date();
    const retentionDays = {
      [LogLevel.CRITICAL]: 2555, // 7 years
      [LogLevel.ERROR]: 1095,    // 3 years
      [LogLevel.WARN]: 365,      // 1 year
      [LogLevel.INFO]: 90,       // 3 months
      [LogLevel.DEBUG]: 30       // 1 month
    };

    const days = retentionDays[level] || 90;
    return new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  }

  /**
   * Log to console for development
   */
  private logToConsole(level: LogLevel, message: string, context: LogContext): void {
    const logMessage = `[${context.userRole || 'SYSTEM'}] ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        this.logger.error(logMessage);
        break;
      case LogLevel.WARN:
        this.logger.warn(logMessage);
        break;
      case LogLevel.INFO:
        this.logger.log(logMessage);
        break;
      case LogLevel.DEBUG:
        this.logger.debug(logMessage);
        break;
    }
  }
}
