import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
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

  @Prop({ type: Types.ObjectId, ref: 'Receptionist' })
  registeredBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: 'patient' })
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
  patientId?: string;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: [String], default: [] })
  medicalConditions: string[];

  @Prop({ type: [String], default: [] })
  medications: string[];

  @Prop({ trim: true })
  emergencyContactName?: string;

  @Prop({ trim: true })
  emergencyContactPhone?: string;

  @Prop({ trim: true })
  emergencyContactRelation?: string;

  @Prop({ type: [String], default: [] })
  languages: string[];

  @Prop({ type: Object })
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    expiryDate?: Date;
  };

  @Prop({ type: [String], default: [] })
  preferredDoctors: Types.ObjectId[];

  @Prop({ type: Object })
  medicalHistory?: {
    previousSurgeries: string[];
    chronicConditions: string[];
    familyHistory: string[];
  };
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
