import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { id: string };
    return this.reportsService.create({ ...body, doctor: user.id });
  }

  @Get('patient/:patientId')
  list(@Param('patientId') patientId: string) {
    return this.reportsService.listByPatient(patientId);
  }
}


