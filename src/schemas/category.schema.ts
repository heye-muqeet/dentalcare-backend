import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SoftDeleteMixin, SoftDeleteDocument } from './base/soft-delete.schema';

export type CategoryDocument = Category & Document & SoftDeleteDocument;

@Schema({ timestamps: true })
export class Category extends SoftDeleteMixin {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  color?: string; // Hex color code for UI theming

  @Prop({ trim: true })
  icon?: string; // Icon name or class for UI

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: 0 })
  usageCount: number; // Track how many services/treatments use this category
}

export const CategorySchema = SchemaFactory.createForClass(Category);
