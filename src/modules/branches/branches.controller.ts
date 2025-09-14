import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(@Request() req: any, @Body() createBranchDto: any) {
    // Only Organization Admin can create branches
    if (req.user.role !== 'organization_admin') {
      throw new Error('Unauthorized');
    }
    return this.branchesService.create(createBranchDto, req.user.userId, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.branchesService.findAll(req.user.role, req.user.organizationId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.findOne(id, req.user.role, req.user.organizationId, req.user.branchId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateBranchDto: any) {
    return this.branchesService.update(id, updateBranchDto, req.user.role, req.user.organizationId, req.user.branchId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.remove(id, req.user.role, req.user.organizationId);
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

  @Get(':id/stats')
  getBranchStats(@Request() req: any, @Param('id') id: string) {
    return this.branchesService.getBranchStats(id, req.user.role, req.user.organizationId, req.user.branchId);
  }
}
