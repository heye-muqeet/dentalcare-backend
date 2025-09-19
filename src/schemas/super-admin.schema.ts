import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SoftDeleteMixin, SoftDeleteDocument } from './base/soft-delete.schema';

export type SuperAdminDocument = SuperAdmin & Document & SoftDeleteDocument;

@Schema({ timestamps: true })
export class SuperAdmin extends SoftDeleteMixin {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: 'super_admin' })
  role: string;
}

export const SuperAdminSchema = SchemaFactory.createForClass(SuperAdmin);
