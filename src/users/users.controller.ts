import { Body, Controller, Get, Post, Put, Delete, Query, Param, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('owner')
  @Get()
  async list(@Req() req: Request, @Query('page') page = '1', @Query('limit') limit = '10') {
    const user = (req as any).user as { organizationId: string };
    return this.usersService.list(user.organizationId, parseInt(page, 10), parseInt(limit, 10));
  }

  @Roles('owner')
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const user = (req as any).user as { organizationId: string; locationId: string };
    return this.usersService.create((req as any).user.id, {
      ...body,
      organization: user.organizationId,
      location: user.locationId,
    });
  }

  @Roles('owner')
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Roles('owner')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Roles('owner', 'receptionist')
  @Get('doctors')
  async doctors(@Req() req: Request) {
    const user = (req as any).user as { organizationId: string };
    return this.usersService.listDoctors(user.organizationId);
  }
}


