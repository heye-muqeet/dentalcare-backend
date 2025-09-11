import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ timestamps: true })
export class Media {
  @Prop({ required: true })
  url: string;

  @Prop({ enum: ['image', 'document', 'xray', 'scan'], required: true })
  type: 'image' | 'document' | 'xray' | 'scan';

  @Prop({ type: String, required: true })
  organization: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String, required: true })
  patient: string;

  @Prop({ type: String })
  appointment?: string;

  @Prop({ type: String })
  treatment?: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);


