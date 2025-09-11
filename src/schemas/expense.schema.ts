import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true })
  expenseNumber: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  date: number; // timestamp

  @Prop({ required: true })
  category: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String, required: true })
  addedBy: string;

  @Prop({ default: 0 })
  deletedAt: number;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);


