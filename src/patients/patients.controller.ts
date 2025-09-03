import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    const user = (req as any).user as { organizationId: string };
    return this.patientsService.list(user.organizationId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
    });
  }

  @Roles('owner', 'receptionist')
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { organizationId: string; locationId: string; id: string };
    return this.patientsService.create({
      ...body,
      organization: user.organizationId,
      location: user.locationId,
      addedBy: user.id,
    });
  }

  @Get(':id/details')
  async details(@Param('id') id: string) {
    return this.patientsService.details(id);
  }
}


