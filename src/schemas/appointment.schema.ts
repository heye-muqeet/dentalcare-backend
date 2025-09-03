import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ required: true })
  date: string; // ISO

  @Prop({ required: true })
  time: string; // HH:mm

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  appointmentTimestamp: number;

  @Prop({ enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' })
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: 1000 })
  fee: number;

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String, required: true })
  patient: string;

  @Prop({ type: String, required: true })
  doctor: string;

  @Prop({ type: String, required: true })
  addedBy: string;

  @Prop({ type: String })
  followUpFor?: string; // appointment id
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);


