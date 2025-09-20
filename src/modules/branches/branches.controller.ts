import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  async create(@Request() req: any, @Body() createBranchDto: any) {
    try {
      // Only Organization Admin can create branches
      if (req.user.role !== 'organization_admin') {
        throw new Error('Unauthorized');
      }
      
      console.log('Branches controller - create called with:', {
        user: req.user,
        branchData: createBranchDto
      });
      
      const savedBranch = await this.branchesService.create(createBranchDto, req.user.userId, req.user.organizationId);
      
      console.log('Branches controller - branch created:', (savedBranch as any)._id);
      
      // Return in the format expected by frontend
      return {
        success: true,
        data: savedBranch,
        message: 'Branch created successfully'
      };
    } catch (error) {
      console.error('Branches controller - create error:', error);
      throw error;
    }
  }

  @Get('stats')
  getBranchesStats(@Request() req: any) {
    return this.branchesService.getBranchesStats(req.user.role, req.user.organizationId);
  }

  @Get()
  async findAll(@Request() req: any) {
    try {
      console.log('Branches controller - findAll called by user:', req.user);
      const branches = await this.branchesService.findAll(req.user.role, req.user.organizationId);
      console.log('Branches controller - found branches:', branches.length);
      
      // Return in the format expected by frontend
      return {
        success: true,
        data: branches,
        total: branches.length,
        page: 1,
        totalPages: 1,
        message: 'Branches retrieved successfully'
      };
    } catch (error) {
      console.error('Branches controller - error:', error);
      throw error;
    }
  }

  @Get('stats/:id')
  getBranchStats(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.getBranchStats(id, req.user.role, req.user.organizationId, req.user.branchId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    try {
      console.log('Branches controller - findOne called:', { id, user: req.user });
      const branch = await this.branchesService.findOne(id, req.user.role, req.user.organizationId, req.user.branchId);
      
      return {
        success: true,
        data: branch,
        message: 'Branch details retrieved successfully'
      };
    } catch (error) {
      console.error('Branches controller - findOne error:', error);
      throw error;
    }
  }

  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() updateBranchDto: any) {
    try {
      console.log('Branches controller - update called:', { id, updateData: updateBranchDto, user: req.user });
      const updatedBranch = await this.branchesService.update(id, updateBranchDto, req.user.role, req.user.organizationId, req.user.branchId);
      
      return {
        success: true,
        data: updatedBranch,
        message: 'Branch updated successfully'
      };
    } catch (error) {
      console.error('Branches controller - update error:', error);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    try {
      console.log('Branches controller - delete called:', { id, reason: body?.reason, user: req.user });
      const result = await this.branchesService.remove(id, req.user.role, req.user.organizationId, body?.reason);
      
      return {
        success: true,
        data: result,
        message: 'Branch deleted successfully'
      };
    } catch (error) {
      console.error('Branches controller - delete error:', error);
      throw error;
    }
  }

  @Patch(':id/restore')
  async restore(@Request() req: any, @Param('id') id: string, @Body() body?: { reason?: string }) {
    try {
      console.log('Branches controller - restore called:', { id, reason: body?.reason, user: req.user });
      const result = await this.branchesService.restore(id, req.user.role, req.user.organizationId, body?.reason);
      
      return {
        success: true,
        data: result,
        message: 'Branch restored successfully'
      };
    } catch (error) {
      console.error('Branches controller - restore error:', error);
      throw error;
    }
  }

  @Get(':id/admins')
  getBranchAdmins(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.getBranchAdmins(id, req.user.role, req.user.organizationId, req.user.branchId);
  }

  @Get(':id/doctors')
  getBranchDoctors(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.getBranchDoctors(id, req.user.role, req.user.organizationId, req.user.branchId);
  }

  @Get(':id/receptionists')
  getBranchReceptionists(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.getBranchReceptionists(id, req.user.role, req.user.organizationId, req.user.branchId);
  }

  @Get(':id/patients')
  getBranchPatients(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.getBranchPatients(id, req.user.role, req.user.organizationId, req.user.branchId);
  }
}
