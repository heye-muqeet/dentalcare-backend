import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  description?: string;

  @Prop({ type: Array, default: [] })
  features: any[];

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ default: 0 })
  deletedAt: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);


