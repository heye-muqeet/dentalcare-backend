import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: String, required: true })
  patient: string;

  @Prop({ type: String, required: true })
  doctor: string;

  @Prop({ type: String })
  treatment?: string;

  @Prop({ type: String })
  appointment?: string;

  @Prop({ enum: ['xray', 'scan', 'blood_test', 'other'], required: true })
  reportType: 'xray' | 'scan' | 'blood_test' | 'other';

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: '' })
  findings: string;

  @Prop({ default: '' })
  recommendations: string;

  @Prop({ type: Array, default: [] })
  mediaUrls: any[];

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ enum: ['pending', 'completed', 'reviewed'], default: 'pending' })
  status: 'pending' | 'completed' | 'reviewed';
}

export const ReportSchema = SchemaFactory.createForClass(Report);


