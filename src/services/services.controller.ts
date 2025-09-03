import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async list(@Req() req: Request) {
    const user = (req as any).user as { organizationId: string };
    return this.servicesService.list(user.organizationId);
  }

  @Roles('owner', 'receptionist')
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { organizationId: string; locationId: string };
    return this.servicesService.create({ ...body, organization: user.organizationId, location: user.locationId });
  }
}


