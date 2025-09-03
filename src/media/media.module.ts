import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from '../schemas/media.schema';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }])],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}


