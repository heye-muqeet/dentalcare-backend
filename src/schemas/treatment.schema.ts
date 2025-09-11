import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TreatmentDocument = HydratedDocument<Treatment>;

@Schema({ timestamps: true })
export class Treatment {
  @Prop({ type: String, required: true })
  appointment: string;

  @Prop({ type: String, required: true })
  doctor: string;

  @Prop({ type: String, required: true })
  patient: string;

  @Prop({ required: true })
  diagnosis: string;

  @Prop({ type: Array, default: [] })
  prescribedMedications: any[];

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: Array, default: [] })
  servicesUsed: any[];

  @Prop({ type: Array, default: [] })
  reports: any[];

  @Prop({ default: false })
  followUpRecommended: boolean;

  @Prop({ default: '' })
  followUpDate: string;

  @Prop({ default: '' })
  followUpTime: string;

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String })
  invoice?: string; // invoice id
}

export const TreatmentSchema = SchemaFactory.createForClass(Treatment);


