import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['cash', 'card', 'bank_transfer', 'other'], required: true })
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';

  @Prop({ required: true })
  paymentDate: Date;

  @Prop()
  transactionId?: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  locationId: string;

  @Prop({ type: String, required: true })
  invoiceId: string;

  @Prop({ type: String, required: true })
  patientId: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);


