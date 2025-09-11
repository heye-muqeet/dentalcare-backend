import { Body, Controller, Get, Post, Put, Query, Param, Req, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('date') date?: string,
    @Query('doctor') doctor?: string,
    @Query('status') status?: string,
    @Query('patient') patient?: string,
  ) {
    const user = (req as any).user as { organizationId: string };
    return this.appointmentsService.list(user.organizationId, { date, doctor, status, patient });
  }

  @Roles('owner', 'receptionist')
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { organizationId: string; locationId: string; id: string };
    return this.appointmentsService.create({
      ...body,
      organization: user.organizationId,
      location: user.locationId,
      addedBy: user.id,
    });
  }

  @Get('available-slots')
  async slots(@Query('doctor') doctor: string, @Query('date') date: string) {
    return this.appointmentsService.getAvailableSlots(doctor, date);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}


