import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface SoftDeleteDocument extends Document {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  deletedReason?: string;
  deletedMetadata?: Record<string, any>;
}

@Schema()
export abstract class SoftDeleteMixin {
  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId })
  deletedBy?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  deletedReason?: string;

  @Prop({ type: Object })
  deletedMetadata?: Record<string, any>;
}

export interface SoftDeleteOptions {
  deletedBy?: string | Types.ObjectId;
  reason?: string;
  metadata?: Record<string, any>;
  permanent?: boolean;
}

export interface RestoreOptions {
  restoredBy?: string | Types.ObjectId;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface SoftDeleteQueryOptions {
  includeDeleted?: boolean;
  deletedOnly?: boolean;
}
