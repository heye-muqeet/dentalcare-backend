import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MediaService } from './media.service';
import type { Request } from 'express';
type Uploaded = any;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  async upload(
    @Req() req: Request,
    @UploadedFile() file: Uploaded,
    @Body() body: any,
  ) {
    const user = (req as any).user as { organizationId: string; locationId: string };
    return this.mediaService.upload(file, {
      url: '',
      type: body.type,
      organization: user.organizationId,
      location: user.locationId,
      patient: body.patient,
      appointment: body.appointment,
      treatment: body.treatment,
    });
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.mediaService.findById(id);
  }
}


