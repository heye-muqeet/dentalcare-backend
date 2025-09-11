import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
    try {
      console.log('Patients controller: Fetching patients list');
      const user = (req as any).user as { organizationId: string };
      
      if (!user || !user.organizationId) {
        console.error('Patients controller: Missing user or organizationId');
        throw new HttpException('User not authenticated properly', HttpStatus.UNAUTHORIZED);
      }
      
      console.log(`Patients controller: Fetching for organization ${user.organizationId}`);
      const result = await this.patientsService.list(user.organizationId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
      });
      
      console.log(`Patients controller: Found ${result.items.length} patients`);
      return result;
    } catch (error) {
      console.error('Patients controller: Error fetching patients:', error);
      throw new HttpException(
        error.message || 'Failed to fetch patients', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Roles('owner', 'receptionist')
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    try {
      const user = (req as any).user as { organizationId: string; locationId: string; id: string };
      
      // Validate required fields
      const requiredFields = ['name', 'email', 'phone', 'gender', 'dob', 'address'];
      for (const field of requiredFields) {
        if (!body[field]) {
          throw new HttpException(`${field} is required`, HttpStatus.BAD_REQUEST);
        }
      }
      
      const result = await this.patientsService.create({
        ...body,
        organization: user.organizationId,
        location: user.locationId,
        addedBy: user.id,
      });
      
      return result;
    } catch (error) {
      console.error('Error creating patient:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create patient', 
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/details')
  async details(@Param('id') id: string) {
    return this.patientsService.details(id);
  }
}


