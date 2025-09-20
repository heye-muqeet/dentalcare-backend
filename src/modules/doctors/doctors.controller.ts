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
}
