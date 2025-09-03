import { Controller, Get, Put, Query, Param, Req, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles('owner', 'receptionist')
  @Get()
  list(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('patient') patient?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = (req as any).user as { organizationId: string };
    return this.invoicesService.list(user.organizationId, { status, patient, startDate, endDate });
  }

  @Roles('owner', 'receptionist')
  @Put(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.invoicesService.markPaid(id);
  }
}


