import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { SuperAdmin, SuperAdminSchema } from '../schemas/super-admin.schema';
import { OrganizationAdmin, OrganizationAdminSchema } from '../schemas/organization-admin.schema';
import { BranchAdmin, BranchAdminSchema } from '../schemas/branch-admin.schema';
import { Doctor, DoctorSchema } from '../schemas/doctor.schema';
import { Receptionist, ReceptionistSchema } from '../schemas/receptionist.schema';
import { Patient, PatientSchema } from '../schemas/patient.schema';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';
import { RefreshToken, RefreshTokenSchema } from '../schemas/refresh-token.schema';
import { AuditLoggerService } from '../services/audit-logger.service';
import { TokenService } from '../services/token.service';
import { TokenCleanupService } from '../services/token-cleanup.service';
import { AuthTokenController } from './auth-token.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
          issuer: 'dental-care-management-system',
          audience: 'dental-care-users'
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: SuperAdmin.name, schema: SuperAdminSchema },
      { name: OrganizationAdmin.name, schema: OrganizationAdminSchema },
      { name: BranchAdmin.name, schema: BranchAdminSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Receptionist.name, schema: ReceptionistSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, AuditLoggerService, TokenService, TokenCleanupService],
  controllers: [AuthController, AuthTokenController],
  exports: [AuthService, TokenCleanupService],
})
export class AuthModule {}
