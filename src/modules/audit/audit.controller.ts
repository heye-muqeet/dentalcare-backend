import { Controller, Get, Post, Query, UseGuards, Request, Param, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuditLoggerService } from '../../services/audit-logger.service';
import { ActivityType, LogLevel, UserRole } from '../../schemas/audit-log.schema';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditLoggerService: AuditLoggerService) {}

  /**
   * Get audit logs with filtering
   */
  @Get('logs')
  async getAuditLogs(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('activityType') activityType?: ActivityType,
    @Query('level') level?: LogLevel,
    @Query('organizationId') organizationId?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isSecurityEvent') isSecurityEvent?: boolean,
    @Query('search') search?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    // Apply role-based filtering
    const filters = this.applyRoleBasedFiltering(req.user, {
      userId,
      activityType,
      level,
      organizationId,
      branchId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isSecurityEvent,
      search,
      limit,
      offset,
    });

    const logs = await this.auditLoggerService.getAuditLogs(filters);

    // Log this audit access
    await this.auditLoggerService.logActivity(
      LogLevel.INFO,
      ActivityType.DATA_VIEWED,
      'Audit logs accessed',
      `User ${req.user.email} accessed audit logs with filters: ${JSON.stringify(filters)}`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userRole: req.user.role,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        endpoint: '/audit/logs',
        method: 'GET',
        metadata: { filters }
      }
    );

    return {
      success: true,
      data: logs,
      total: logs.length,
      filters: filters
    };
  }

  /**
   * Get audit statistics
   */
  @Get('stats')
  async getAuditStats(@Request() req: any) {
    // Apply role-based filtering for stats
    const organizationId = this.getOrganizationFilter(req.user);
    const branchId = this.getBranchFilter(req.user);

    const stats = await this.auditLoggerService.getAuditStats(organizationId, branchId);

    // Log this stats access
    await this.auditLoggerService.logActivity(
      LogLevel.INFO,
      ActivityType.DATA_VIEWED,
      'Audit statistics accessed',
      `User ${req.user.email} accessed audit statistics`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userRole: req.user.role,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        endpoint: '/audit/stats',
        method: 'GET'
      }
    );

    return {
      success: true,
      data: stats
    };
  }

  /**
   * Get user activity logs
   */
  @Get('user/:userId/activity')
  async getUserActivity(
    @Request() req: any,
    @Param('userId') targetUserId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    // Check if user has permission to view this user's activity
    if (!this.canViewUserActivity(req.user, targetUserId)) {
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.UNAUTHORIZED_ACCESS,
        `Unauthorized attempt to view user activity for user ${targetUserId}`,
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role,
          organizationId: req.user.organizationId,
          branchId: req.user.branchId,
          metadata: { targetUserId }
        }
      );

      throw new Error('Unauthorized to view this user\'s activity');
    }

    const logs = await this.auditLoggerService.getAuditLogs({
      userId: targetUserId,
      limit,
      offset
    });

    // Log this user activity access
    await this.auditLoggerService.logActivity(
      LogLevel.INFO,
      ActivityType.DATA_VIEWED,
      'User activity accessed',
      `User ${req.user.email} accessed activity logs for user ${targetUserId}`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userRole: req.user.role,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        endpoint: `/audit/user/${targetUserId}/activity`,
        method: 'GET',
        metadata: { targetUserId }
      }
    );

    return {
      success: true,
      data: logs,
      total: logs.length
    };
  }

  /**
   * Get security events
   */
  @Get('security-events')
  async getSecurityEvents(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    // Only super admins and organization admins can view security events
    if (!this.canViewSecurityEvents(req.user)) {
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.UNAUTHORIZED_ACCESS,
        `Unauthorized attempt to view security events`,
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role,
          organizationId: req.user.organizationId,
          branchId: req.user.branchId
        }
      );

      throw new Error('Unauthorized to view security events');
    }

    const logs = await this.auditLoggerService.getAuditLogs({
      isSecurityEvent: true,
      limit,
      offset
    });

    // Log this security events access
    await this.auditLoggerService.logActivity(
      LogLevel.INFO,
      ActivityType.DATA_VIEWED,
      'Security events accessed',
      `User ${req.user.email} accessed security events`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userRole: req.user.role,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        endpoint: '/audit/security-events',
        method: 'GET'
      }
    );

    return {
      success: true,
      data: logs,
      total: logs.length
    };
  }

  /**
   * Clean up old audit logs (Super Admin only)
   */
  @Post('cleanup')
  async cleanupOldLogs(@Request() req: any) {
    // Only super admins can clean up logs
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      await this.auditLoggerService.logSecurityEvent(
        ActivityType.UNAUTHORIZED_ACCESS,
        `Unauthorized attempt to clean up audit logs`,
        {
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role,
          organizationId: req.user.organizationId,
          branchId: req.user.branchId
        }
      );

      throw new Error('Unauthorized to clean up audit logs');
    }

    const deletedCount = await this.auditLoggerService.cleanupOldLogs();

    // Log this cleanup action
    await this.auditLoggerService.logActivity(
      LogLevel.INFO,
      ActivityType.SYSTEM_STARTUP,
      'Audit logs cleanup performed',
      `User ${req.user.email} performed audit logs cleanup, deleted ${deletedCount} logs`,
      {
        userId: req.user.userId,
        userEmail: req.user.email,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userRole: req.user.role,
        organizationId: req.user.organizationId,
        branchId: req.user.branchId,
        endpoint: '/audit/cleanup',
        method: 'POST',
        metadata: { deletedCount }
      }
    );

    return {
      success: true,
      message: `Cleaned up ${deletedCount} expired audit logs`
    };
  }

  /**
   * Apply role-based filtering to audit logs
   */
  private applyRoleBasedFiltering(user: any, filters: any): any {
    const filteredFilters = { ...filters };

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        // Super admins can see everything
        break;
      
      case UserRole.ORGANIZATION_ADMIN:
        // Organization admins can only see their organization's logs
        filteredFilters.organizationId = user.organizationId;
        break;
      
      case UserRole.BRANCH_ADMIN:
        // Branch admins can only see their branch's logs
        filteredFilters.organizationId = user.organizationId;
        filteredFilters.branchId = user.branchId;
        break;
      
      case UserRole.DOCTOR:
      case UserRole.RECEPTIONIST:
      case UserRole.PATIENT:
        // Other roles can only see their own logs
        filteredFilters.userId = user.userId;
        break;
    }

    return filteredFilters;
  }

  /**
   * Check if user can view another user's activity
   */
  private canViewUserActivity(user: any, targetUserId: string): boolean {
    // Users can always view their own activity
    if (user.userId === targetUserId) {
      return true;
    }

    // Super admins can view anyone's activity
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Organization admins can view their organization's users
    if (user.role === UserRole.ORGANIZATION_ADMIN) {
      // This would need additional logic to check if targetUserId belongs to the same organization
      return true; // Simplified for now
    }

    // Branch admins can view their branch's users
    if (user.role === UserRole.BRANCH_ADMIN) {
      // This would need additional logic to check if targetUserId belongs to the same branch
      return true; // Simplified for now
    }

    return false;
  }

  /**
   * Check if user can view security events
   */
  private canViewSecurityEvents(user: any): boolean {
    return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORGANIZATION_ADMIN;
  }

  /**
   * Get organization filter based on user role
   */
  private getOrganizationFilter(user: any): string | undefined {
    if (user.role === UserRole.SUPER_ADMIN) {
      return undefined; // Can see all organizations
    }
    return user.organizationId;
  }

  /**
   * Get branch filter based on user role
   */
  private getBranchFilter(user: any): string | undefined {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORGANIZATION_ADMIN) {
      return undefined; // Can see all branches in their scope
    }
    return user.branchId;
  }
}
