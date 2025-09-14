import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeederService } from './seeder.service';
import { SuperAdminSeeder } from './super-admin.seeder';
import { SuperAdmin, SuperAdminSchema } from '../schemas/super-admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SuperAdmin.name, schema: SuperAdminSchema },
    ]),
  ],
  providers: [SeederService, SuperAdminSeeder],
})
export class SeederModule {}
