import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

export enum TokenStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  ROTATED = 'rotated'
}

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  userRole: string;

  @Prop({ type: String })
  organizationId?: string;

  @Prop({ type: String })
  branchId?: string;

  @Prop({ required: true, enum: TokenStatus, default: TokenStatus.ACTIVE })
  status: TokenStatus;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: String })
  deviceId?: string;

  @Prop({ type: String })
  deviceName?: string;

  @Prop({ type: String })
  parentTokenId?: string; // For token rotation

  @Prop({ type: [String], default: [] })
  childTokenIds: string[];

  @Prop({ type: Number, default: 0 })
  usageCount: number;

  @Prop({ type: Number, default: 0 })
  maxUsageCount: number;

  @Prop({ type: Boolean, default: false })
  isRememberMe: boolean;

  @Prop({ type: String })
  revokedBy?: string;

  @Prop({ type: String })
  revokedReason?: string;

  @Prop({ type: Date })
  revokedAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Timestamps
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Indexes for better performance
// Note: token field already has unique: true which creates an index
RefreshTokenSchema.index({ userId: 1, status: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userEmail: 1, status: 1 });
RefreshTokenSchema.index({ organizationId: 1, status: 1 });
RefreshTokenSchema.index({ branchId: 1, status: 1 });
RefreshTokenSchema.index({ deviceId: 1, status: 1 });
RefreshTokenSchema.index({ parentTokenId: 1 });
RefreshTokenSchema.index({ createdAt: -1 });
RefreshTokenSchema.index({ lastUsedAt: -1 });
