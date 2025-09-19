import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Request() req: any, @Body() createOrganizationDto: any) {
    // Only Super Admin can create organizations
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized');
    }
    return this.organizationsService.create(createOrganizationDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.organizationsService.findAll(req.user.role, req.user.organizationId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.organizationsService.findOne(id, req.user.role, req.user.organizationId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateOrganizationDto: any) {
    return this.organizationsService.update(id, updateOrganizationDto, req.user.role, req.user.organizationId);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    const auditContext = {
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      organizationId: req.user.organizationId,
      branchId: req.user.branchId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await this.organizationsService.cascadeSoftDelete(
      id, 
      req.user.role,
      {
        deletedBy: req.user.userId,
        reason: body?.reason || 'Organization deletion',
        metadata: {
          source: 'api_request',
          userRole: req.user.role
        }
      },
      auditContext
    );

    return {
      success: true,
      message: `Organization and ${result.cascaded.reduce((sum, item) => sum + item.deletedCount, 0)} related entities soft deleted`,
      data: {
        organization: result.parent,
        cascadeResults: result.cascaded
      }
    };
  }

  @Get(':id/admins')
  getOrganizationAdmins(@Request() req: any, @Param('id') id: string) {
    return this.organizationsService.getOrganizationAdmins(id, req.user.role, req.user.organizationId);
  }

  @Post(':id/admins')
  createOrganizationAdmin(@Request() req: any, @Param('id') id: string, @Body() createOrgAdminDto: any) {
    // Only Super Admin can create organization admins
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized');
    }
    return this.organizationsService.createOrganizationAdmin(id, createOrgAdminDto, req.user.userId);
  }

  @Put(':id/restore')
  async restore(@Request() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    const auditContext = {
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      organizationId: req.user.organizationId,
      branchId: req.user.branchId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await this.organizationsService.cascadeRestore(
      id,
      req.user.role,
      {
        restoredBy: req.user.userId,
        reason: body?.reason || 'Organization restoration',
        metadata: {
          source: 'api_request',
          userRole: req.user.role
        }
      },
      auditContext
    );

    return {
      success: true,
      message: `Organization and ${result.cascaded.reduce((sum, item) => sum + item.restoredCount, 0)} related entities restored`,
      data: {
        organization: result.parent,
        cascadeResults: result.cascaded
      }
    };
  }

  @Get(':id/stats')
  getOrganizationStats(@Request() req: any, @Param('id') id: string) {
    return this.organizationsService.getOrganizationStats(id, req.user.role, req.user.organizationId);
  }
}
