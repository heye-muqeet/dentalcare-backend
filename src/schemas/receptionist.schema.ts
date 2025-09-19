import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SoftDeleteMixin, SoftDeleteDocument } from './base/soft-delete.schema';

export type ReceptionistDocument = Receptionist & Document & SoftDeleteDocument;

@Schema({ timestamps: true })
export class Receptionist extends SoftDeleteMixin {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BranchAdmin', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: 'receptionist' })
  role: string;

  @Prop()
  profileImage?: string;

  @Prop()
  profileImagePublicId?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ trim: true })
  employeeId?: string;

  @Prop({ type: [String], default: [] })
  languages: string[];

  @Prop({ type: Object })
  workingHours: {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
  };

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Number, default: 0 })
  experienceYears: number;
}

export const ReceptionistSchema = SchemaFactory.createForClass(Receptionist);
