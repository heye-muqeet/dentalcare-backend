import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SoftDeleteService } from '../../services/soft-delete.service';
import { AuditLoggerService } from '../../services/audit-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema }
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, SoftDeleteService, AuditLoggerService],
  exports: [UsersService],
})
export class UsersModule {}
