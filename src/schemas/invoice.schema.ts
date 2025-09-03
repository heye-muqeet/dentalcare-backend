import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  tax: number;

  @Prop({ required: true })
  total: number;

  @Prop({ enum: ['due', 'paid', 'overdue'], default: 'due' })
  status: 'due' | 'paid' | 'overdue';

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: Array, default: [] })
  services: any[];

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String, required: true })
  patient: string;

  @Prop({ type: String, required: true })
  treatment: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);


