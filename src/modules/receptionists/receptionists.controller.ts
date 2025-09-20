import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ReceptionistsService } from './receptionists.service';
import type { CreateReceptionistDto, UpdateReceptionistDto } from './receptionists.service';

@Controller('receptionists')
@UseGuards(JwtAuthGuard)
export class ReceptionistsController {
  constructor(private readonly receptionistsService: ReceptionistsService) {}

  @Post('branch/:branchId')
  async create(
    @Param('branchId') branchId: string,
    @Body() createReceptionistDto: CreateReceptionistDto,
    @Request() req: any
  ) {
    console.log('ReceptionistsController.create called:', { branchId, receptionistEmail: createReceptionistDto.email });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const receptionist = await this.receptionistsService.create(
      createReceptionistDto,
      branchId,
      organizationId,
      user.userId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Receptionist created successfully',
      data: receptionist
    };
  }

  @Get('branch/:branchId')
  async findAll(
    @Param('branchId') branchId: string,
    @Request() req: any
  ) {
    console.log('ReceptionistsController.findAll called:', { branchId });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const receptionists = await this.receptionistsService.findAll(
      branchId,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      data: receptionists
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    console.log('ReceptionistsController.findOne called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const receptionist = await this.receptionistsService.findOne(
      id,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      data: receptionist
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateReceptionistDto: UpdateReceptionistDto,
    @Request() req: any
  ) {
    console.log('ReceptionistsController.update called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const receptionist = await this.receptionistsService.update(
      id,
      updateReceptionistDto,
      user.role,
      organizationId,
      user.branchId
    );

    return {
      success: true,
      message: 'Receptionist updated successfully',
      data: receptionist
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    console.log('ReceptionistsController.remove called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const result = await this.receptionistsService.remove(
      id,
      user.role,
      organizationId,
      user.branchId,
      user.userId
    );

    return {
      success: true,
      ...result
    };
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Request() req: any) {
    console.log('ReceptionistsController.restore called:', { id });

    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const receptionist = await this.receptionistsService.restore(
      id,
      user.role,
      organizationId,
      user.branchId,
      user.userId
    );

    return {
      success: true,
      message: 'Receptionist restored successfully',
      data: receptionist
    };
  }
}
