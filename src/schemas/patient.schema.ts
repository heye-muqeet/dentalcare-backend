import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ enum: ['male', 'female', 'other'], required: true })
  gender: 'male' | 'female' | 'other';

  @Prop({ required: true })
  dob: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: '' })
  medicalHistory: string;

  @Prop({ default: '' })
  allergies: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  deletedAt: number;

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String, required: true })
  addedBy: string; // user id
}

export const PatientSchema = SchemaFactory.createForClass(Patient);


