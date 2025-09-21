import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SoftDeleteMixin, SoftDeleteDocument } from './base/soft-delete.schema';

export type ServiceDocument = Service & Document & SoftDeleteDocument;

@Schema({ timestamps: true })
export class Service extends SoftDeleteMixin {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, min: 1 })
  duration: number; // in minutes

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  maxPrice?: number; // Optional maximum price for price range

  @Prop({ default: false })
  isPriceRange: boolean; // Indicates if this is a price range or fixed price

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
