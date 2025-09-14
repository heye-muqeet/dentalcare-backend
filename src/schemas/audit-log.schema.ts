import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
  CRITICAL = 'critical'
}

export enum ActivityType {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  TOKEN_REFRESH = 'token_refresh',
  
  // User Management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  USER_ACCESS = 'user_access',
  
  // Organization Management
  ORGANIZATION_CREATED = 'organization_created',
  ORGANIZATION_UPDATED = 'organization_updated',
  ORGANIZATION_DELETED = 'organization_deleted',
  
  // Branch Management
  BRANCH_CREATED = 'branch_created',
  BRANCH_UPDATED = 'branch_updated',
  BRANCH_DELETED = 'branch_deleted',
  
  // File Management
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  FILE_DOWNLOADED = 'file_downloaded',
  
  // System Events
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  CONFIGURATION_CHANGED = 'configuration_changed',
  
  // API Access
  API_ACCESS = 'api_access',
  API_ERROR = 'api_error',
  PERMISSION_DENIED = 'permission_denied',
  
  // Data Access
  DATA_VIEWED = 'data_viewed',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  BRANCH_ADMIN = 'branch_admin',
  DOCTOR = 'doctor',
  RECEPTIONIST = 'receptionist',
  PATIENT = 'patient',
  SYSTEM = 'system'
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true, enum: LogLevel })
  level: LogLevel;

  @Prop({ required: true, enum: ActivityType })
  activityType: ActivityType;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  description: string;

  // User Information
  @Prop({ type: String })
  userId?: string;

  @Prop({ type: String })
  userEmail?: string;

  @Prop({ type: String })
  userName?: string;

  @Prop({ enum: UserRole })
  userRole?: UserRole;

  // Organization and Branch Context
  @Prop({ type: String })
  organizationId?: string;

  @Prop({ type: String })
  organizationName?: string;

  @Prop({ type: String })
  branchId?: string;

  @Prop({ type: String })
  branchName?: string;

  // Request Information
  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: String })
  requestId?: string;

  @Prop({ type: String })
  endpoint?: string;

  @Prop({ type: String })
  method?: string;

  @Prop({ type: Number })
  statusCode?: number;

  @Prop({ type: Number })
  responseTime?: number;

  // Additional Data
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Object })
  oldValues?: Record<string, any>;

  @Prop({ type: Object })
  newValues?: Record<string, any>;

  // Security Information
  @Prop({ type: Boolean, default: false })
  isSecurityEvent: boolean;

  @Prop({ type: String })
  securityLevel?: string;

  // System Information
  @Prop({ type: String })
  module?: string;

  @Prop({ type: String })
  service?: string;

  @Prop({ type: String })
  version?: string;

  // Timestamps
  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  // Indexing fields for better query performance
  @Prop({ type: String })
  searchableText?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for better query performance
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ activityType: 1, timestamp: -1 });
AuditLogSchema.index({ level: 1, timestamp: -1 });
AuditLogSchema.index({ organizationId: 1, timestamp: -1 });
AuditLogSchema.index({ branchId: 1, timestamp: -1 });
AuditLogSchema.index({ isSecurityEvent: 1, timestamp: -1 });
AuditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Text search index
AuditLogSchema.index({ searchableText: 'text' });
