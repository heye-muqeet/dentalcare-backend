import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import { AuditLoggerService } from '../../services/audit-logger.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema }
    ])
  ],
  providers: [AuditLoggerService],
  controllers: [AuditController],
  exports: [AuditLoggerService]
})
export class AuditModule {}
