import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SoftDeleteMixin, SoftDeleteDocument } from './base/soft-delete.schema';

export type UserDocument = User & Document & SoftDeleteDocument;

@Schema({ timestamps: true })
export class User extends SoftDeleteMixin {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ 
    type: String, 
    enum: ['patient', 'dentist', 'admin'], 
    default: 'patient' 
  })
  role: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  profileImage?: string;

  @Prop()
  profileImagePublicId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
