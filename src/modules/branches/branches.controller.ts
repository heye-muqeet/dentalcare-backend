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

  @Get('debug')
  async debugBranches(@Request() req: any) {
    try {
      console.log('=== BRANCH DEBUG ENDPOINT ===');
      console.log('User:', req.user);
      
      // Get all branches for debugging
      const allBranches = await this.branchesService.debugGetAllBranches();
      
      // Get all branch admins for debugging  
      const allAdmins = await this.branchesService.debugGetAllBranchAdmins();
      
      return {
        success: true,
        data: {
          user: req.user,
          branches: allBranches,
          admins: allAdmins
        }
      };
    } catch (error) {
      console.error('Debug endpoint error:', error);
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

  @Get('organization-services')
  async getOrganizationServices(@Request() req: any) {
    try {
      console.log('BranchesController.getOrganizationServices called');
      console.log('User from request:', req.user);
      
      const user = req.user;
      const organizationId = typeof user.organizationId === 'string' 
        ? user.organizationId 
        : user.organizationId?._id || user.organizationId?.id;

      console.log('Extracted organizationId:', organizationId);
      console.log('User role:', user.role);

      const services = await this.branchesService.getOrganizationServices(
        organizationId,
        user.role
      );

      return {
        success: true,
        data: services,
        message: 'Organization services retrieved successfully'
      };
    } catch (error) {
      console.error('Error in getOrganizationServices:', error);
      throw error;
    }
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
  async getBranchAdmins(@Request() req: any, @Param('id') id: string) {
    try {
      console.log('BranchesController.getBranchAdmins called:', { branchId: id, user: req.user });
      const admins = await this.branchesService.getBranchAdmins(id, req.user.role, req.user.organizationId, req.user.branchId);
      
      return {
        success: true,
        data: admins,
        message: 'Branch admins retrieved successfully'
      };
    } catch (error) {
      console.error('BranchesController.getBranchAdmins error:', error);
      throw error;
    }
  }

  @Get(':id/doctors')
  async getBranchDoctors(@Request() req: any, @Param('id') id: string) {
    try {
      console.log('BranchesController.getBranchDoctors called:', { branchId: id, user: req.user });
      const doctors = await this.branchesService.getBranchDoctors(id, req.user.role, req.user.organizationId, req.user.branchId);
      
      return {
        success: true,
        data: doctors,
        message: 'Doctors retrieved successfully'
      };
    } catch (error) {
      console.error('BranchesController.getBranchDoctors error:', error);
      throw error;
    }
  }

  @Get(':id/receptionists')
  async getBranchReceptionists(@Request() req: any, @Param('id') id: string) {
    try {
      console.log('BranchesController.getBranchReceptionists called:', { branchId: id, user: req.user });
      const receptionists = await this.branchesService.getBranchReceptionists(id, req.user.role, req.user.organizationId, req.user.branchId);
      
      return {
        success: true,
        data: receptionists,
        message: 'Receptionists retrieved successfully'
      };
    } catch (error) {
      console.error('BranchesController.getBranchReceptionists error:', error);
      throw error;
    }
  }

  @Get(':id/patients')
  async getBranchPatients(@Request() req: any, @Param('id') id: string) {
    try {
      console.log('BranchesController.getBranchPatients called:', { branchId: id, user: req.user });
      const patients = await this.branchesService.getBranchPatients(id, req.user.role, req.user.organizationId, req.user.branchId);
      
      return {
        success: true,
        data: patients,
        message: 'Patients retrieved successfully'
      };
    } catch (error) {
      console.error('BranchesController.getBranchPatients error:', error);
      throw error;
    }
  }

  @Post(':id/patients')
  async createPatient(
    @Request() req: any,
    @Param('id') branchId: string,
    @Body() createPatientDto: any
  ) {
    console.log('BranchesController.createPatient called:', { branchId, patientData: createPatientDto });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const patient = await this.branchesService.createPatient(
      createPatientDto,
      branchId,
      organizationId,
      user.userId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Patient created successfully',
      data: patient
    };
  }

  @Get(':id/services')
  async getBranchServices(@Request() req: any, @Param('id') id: string) {
    try {
      console.log('BranchesController.getBranchServices called:', { branchId: id, user: req.user });
      const services = await this.branchesService.getBranchServices(id, req.user.role, req.user.organizationId, req.user.branchId);
      
      return {
        success: true,
        data: services,
        message: 'Services retrieved successfully'
      };
    } catch (error) {
      console.error('BranchesController.getBranchServices error:', error);
      throw error;
    }
  }

  @Post(':id/services')
  async createService(
    @Request() req: any,
    @Param('id') branchId: string,
    @Body() createServiceDto: any
  ) {
    console.log('BranchesController.createService called:', { branchId, serviceData: createServiceDto });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const service = await this.branchesService.createService(
      createServiceDto,
      branchId,
      organizationId,
      user.userId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Service created successfully',
      data: service
    };
  }

  @Patch('services/:serviceId')
  async updateService(
    @Request() req: any,
    @Param('serviceId') serviceId: string,
    @Body() updateServiceDto: any
  ) {
    console.log('BranchesController.updateService called:', { serviceId, serviceData: updateServiceDto });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const service = await this.branchesService.updateService(
      serviceId,
      updateServiceDto,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Service updated successfully',
      data: service
    };
  }

  @Delete('services/:serviceId')
  async deleteService(
    @Request() req: any,
    @Param('serviceId') serviceId: string
  ) {
    console.log('BranchesController.deleteService called:', { serviceId });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const result = await this.branchesService.deleteService(
      serviceId,
      user.role,
      organizationId,
      user.branchId,
      user.userId
    );

    return {
      success: true,
      message: result.message
    };
  }

  @Patch('services/:serviceId/restore')
  async restoreService(
    @Request() req: any,
    @Param('serviceId') serviceId: string
  ) {
    console.log('BranchesController.restoreService called:', { serviceId });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const service = await this.branchesService.restoreService(
      serviceId,
      user.role,
      organizationId,
      user.branchId,
      user.userId
    );

    return {
      success: true,
      message: 'Service restored successfully',
      data: service
    };
  }
}
