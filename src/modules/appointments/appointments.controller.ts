import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import type { CreateAppointmentDto, UpdateAppointmentDto } from './appointments.service';
import { AppointmentStatus, VisitType } from '../../schemas/appointment.enums';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Request() req: any
  ) {
    const { branchId, organizationId, role, organizationId: userOrgId, branchId: userBranchId } = req.user;
    
    return this.appointmentsService.create(
      createAppointmentDto,
      branchId,
      organizationId,
      req.user.id,
      role,
      userOrgId,
      userBranchId
    );
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('status') status?: AppointmentStatus,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const { branchId, organizationId, role, organizationId: userOrgId, branchId: userBranchId } = req.user;
    
    const filters = {
      ...(status && { status }),
      ...(doctorId && { doctorId }),
      ...(patientId && { patientId }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    };

    return this.appointmentsService.findAll(
      branchId,
      organizationId,
      role,
      userOrgId,
      userBranchId,
      filters
    );
  }

  @Get('available-slots')
  async getAvailableSlots(
    @Request() req: any,
    @Query('date') date: string,
    @Query('doctorId') doctorId?: string,
    @Query('duration') duration?: number,
  ) {
    const { branchId, organizationId } = req.user;
    
    if (!date) {
      throw new Error('Date parameter is required');
    }

    return this.appointmentsService.getAvailableSlots(
      branchId,
      organizationId,
      date,
      doctorId,
      duration || 30
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const { branchId, organizationId, role, organizationId: userOrgId, branchId: userBranchId } = req.user;
    
    return this.appointmentsService.findOne(
      id,
      branchId,
      organizationId,
      role,
      userOrgId,
      userBranchId
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req: any
  ) {
    const { branchId, organizationId, role, organizationId: userOrgId, branchId: userBranchId } = req.user;
    
    return this.appointmentsService.update(
      id,
      updateAppointmentDto,
      branchId,
      organizationId,
      role,
      userOrgId,
      userBranchId
    );
  }

  @Delete(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason: string,
    @Request() req: any
  ) {
    const { branchId, organizationId, role, organizationId: userOrgId, branchId: userBranchId } = req.user;
    
    return this.appointmentsService.cancel(
      id,
      cancellationReason,
      branchId,
      organizationId,
      req.user.id,
      role,
      userOrgId,
      userBranchId
    );
  }

  @Post('validate-slot')
  @HttpCode(HttpStatus.OK)
  async validateSlot(
    @Body() body: {
      doctorId?: string;
      appointmentDate: string;
      startTime: string;
      endTime: string;
      patientId: string;
      excludeAppointmentId?: string;
    },
    @Request() req: any
  ) {
    const { branchId } = req.user;
    
    return this.appointmentsService.validateSlotAvailability(
      body.doctorId,
      branchId,
      new Date(body.appointmentDate),
      body.startTime,
      body.endTime,
      body.patientId,
      body.excludeAppointmentId
    );
  }
}
