import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReceptionistsService } from './receptionists.service';
import { ReceptionistsController } from './receptionists.controller';
import { Receptionist, ReceptionistSchema } from '../../schemas/receptionist.schema';
import { Branch, BranchSchema } from '../../schemas/branch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Receptionist.name, schema: ReceptionistSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  controllers: [ReceptionistsController],
  providers: [ReceptionistsService],
  exports: [ReceptionistsService],
})
export class ReceptionistsModule {}
