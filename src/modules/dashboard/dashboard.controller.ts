import { Controller, Get, UseGuards, Request, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('system-stats')
  async getSystemStats(@Request() req: any) {
    // Only super admins can access system-wide stats
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Only super admins can access system statistics');
    }

    return this.dashboardService.getSystemStats();
  }

  @Get('health')
  async getSystemHealth(@Request() req: any) {
    // Only super admins can access system health
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Only super admins can access system health');
    }

    return this.dashboardService.getSystemHealth();
  }

  @Get('stats')
  async getDashboardStats(@Request() req: any) {
    // Role-based dashboard stats
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;
    const branchId = req.user.branchId;

    if (userRole === 'super_admin') {
      return this.dashboardService.getSystemStats();
    }

    if (userRole === 'organization_admin' && organizationId) {
      return this.dashboardService.getOrganizationStats(organizationId);
    }

    // For other roles, return basic stats
    return {
      message: 'Dashboard stats not available for this role',
      userRole,
      organizationId,
      branchId
    };
  }

  @Get('organization/:id/stats')
  async getOrganizationStats(@Request() req: any, @Param('id') id: string) {
    // Only super admins and organization admins can access organization stats
    if (req.user.role !== 'super_admin' && 
        (req.user.role !== 'organization_admin' || req.user.organizationId !== id)) {
      throw new Error('Unauthorized: Insufficient permissions to access organization statistics');
    }

    return this.dashboardService.getOrganizationStats(id);
  }

  @Get('system-users')
  async getSystemUsers(@Request() req: any, @Query() query: any) {
    // Only super admins can access system users
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Only super admins can access system users');
    }

    return this.dashboardService.getAllSystemUsers(query);
  }
}
