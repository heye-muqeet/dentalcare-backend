import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuditLoggerService } from './services/audit-logger.service';
import { ActivityType, LogLevel } from './schemas/audit-log.schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get audit logger service for system logging
  const auditLoggerService = app.get(AuditLoggerService);
  
  // Get CORS origins from environment variable
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // Log system startup
  await auditLoggerService.logSystemEvent(
    ActivityType.SYSTEM_STARTUP,
    'Dental Care Management System started',
    {
      module: 'system',
      service: 'main',
      version: process.env.npm_package_version || '1.0.0',
      metadata: {
        port,
        corsOrigins,
        nodeVersion: process.version,
        platform: process.platform
      }
    }
  );
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌐 CORS enabled for origins: ${corsOrigins.join(', ')}`);
  console.log(`📊 Audit logging enabled - All activities are being tracked`);
}
bootstrap();
