import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DoctorsService } from './doctors.service';
import type { CreateDoctorDto, UpdateDoctorDto } from './doctors.service';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post('branch/:branchId')
  async create(
    @Param('branchId') branchId: string,
    @Body() createDoctorDto: CreateDoctorDto,
    @Request() req: any
  ) {
    console.log('DoctorsController.create called:', { branchId, doctorEmail: createDoctorDto.email });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const doctor = await this.doctorsService.create(
      createDoctorDto,
      branchId,
      organizationId,
      user.userId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    };
  }

  @Get('branch/:branchId')
  async findAll(
    @Param('branchId') branchId: string,
    @Request() req: any
  ) {
    console.log('DoctorsController.findAll called:', { branchId });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const doctors = await this.doctorsService.findAll(
      branchId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      data: doctors
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    console.log('DoctorsController.findOne called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const doctor = await this.doctorsService.findOne(
      id,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      data: doctor
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Request() req: any
  ) {
    console.log('DoctorsController.update called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const doctor = await this.doctorsService.update(
      id,
      updateDoctorDto,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    console.log('DoctorsController.remove called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const result = await this.doctorsService.remove(
      id,
      user.role,
      organizationId,
      user.branchId,
      user.userId
    );

    return {
      success: true,
      ...result
    };
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Request() req: any) {
    console.log('DoctorsController.restore called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const doctor = await this.doctorsService.restore(
      id,
      user.role,
      organizationId,
      user.branchId,
      user.userId
    );

    return {
      success: true,
      message: 'Doctor restored successfully',
      data: doctor
    };
  }

  @Post(':id/set-active-in-branch/:branchId')
  async setDoctorActiveInBranch(
    @Param('id') doctorId: string,
    @Param('branchId') branchId: string,
    @Request() req: any
  ) {
    console.log('DoctorsController.setDoctorActiveInBranch called:', { doctorId, branchId });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const doctor = await this.doctorsService.setDoctorActiveInBranch(
      doctorId,
      branchId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Doctor set as active in branch successfully',
      data: doctor
    };
  }

  @Post(':id/set-inactive-in-branch/:branchId')
  async setDoctorInactiveInBranch(
    @Param('id') doctorId: string,
    @Param('branchId') branchId: string,
    @Request() req: any
  ) {
    console.log('DoctorsController.setDoctorInactiveInBranch called:', { doctorId, branchId });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const doctor = await this.doctorsService.setDoctorInactiveInBranch(
      doctorId,
      branchId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Doctor set as inactive in branch successfully',
      data: doctor
    };
  }

  @Get('branch/:branchId/active')
  async getActiveDoctorsInBranch(
    @Param('branchId') branchId: string,
    @Request() req: any
  ) {
    console.log('DoctorsController.getActiveDoctorsInBranch called:', { branchId });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const activeDoctors = await this.doctorsService.getActiveDoctorsInBranch(
      branchId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      data: activeDoctors
    };
  }

  @Post('branch/:branchId/deactivate-all')
  async deactivateAllDoctorsInBranch(
    @Param('branchId') branchId: string,
    @Request() req: any
  ) {
    console.log('DoctorsController.deactivateAllDoctorsInBranch called:', { branchId });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const result = await this.doctorsService.deactivateAllDoctorsInBranch(
      branchId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: `${result.deactivatedCount} doctor(s) deactivated successfully`,
      data: result
    };
  }
}
