import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Roles('owner', 'receptionist')
  @Get()
  list(
    @Req() req: Request,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const user = (req as any).user as { organizationId: string };
    return this.expensesService.list(user.organizationId, { category, startDate, endDate }, parseInt(page, 10), parseInt(limit, 10));
  }

  @Roles('owner', 'receptionist')
  @Post()
  create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { organizationId: string; locationId: string; id: string };
    return this.expensesService.create({ ...body, organization: user.organizationId, location: user.locationId, addedBy: user.id });
  }

  @Roles('owner', 'receptionist')
  @Get('summary')
  summary(@Req() req: Request) {
    const user = (req as any).user as { organizationId: string };
    return this.expensesService.summary(user.organizationId);
  }
}


