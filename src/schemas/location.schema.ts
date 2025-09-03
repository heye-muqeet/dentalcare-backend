import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LocationDocument = HydratedDocument<Location>;

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ enum: ['active', 'inactive', 'maintenance'], default: 'active' })
  status: 'active' | 'inactive' | 'maintenance';

  @Prop({ type: String, required: true })
  organization: string; // ref Organization id

  @Prop({ type: Object, default: {
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
    wednesday: { open: '09:00', close: '17:00' },
    thursday: { open: '09:00', close: '17:00' },
    friday: { open: '09:00', close: '17:00' },
    saturday: { open: '09:00', close: '13:00' },
    sunday: { open: null, close: null }
  } })
  openingHours: Record<string, { open: string | null; close: string | null }>;
}

export const LocationSchema = SchemaFactory.createForClass(Location);


