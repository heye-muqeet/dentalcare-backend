import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Roles('owner', 'doctor')
  @Post()
  create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { organizationId: string; locationId: string; id: string };
    return this.treatmentsService.create({
      ...body,
      organization: user.organizationId,
      location: user.locationId,
      doctor: body.doctor || user.id,
    });
  }

  @Get()
  list(@Req() req: Request, @Query() q: any) {
    const user = (req as any).user;
    return this.treatmentsService.list(q, user);
  }
}


