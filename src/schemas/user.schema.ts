import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ enum: ['owner', 'receptionist', 'doctor'], required: true })
  role: 'owner' | 'receptionist' | 'doctor';

  @Prop()
  gender?: string;

  @Prop()
  age?: number;

  @Prop({ default: '' })
  profileImage: string;

  @Prop()
  specialization?: string;

  @Prop()
  licenseNumber?: string;

  @Prop()
  licenseDocumentUrl?: string;

  @Prop()
  experience?: number;

  @Prop()
  education?: string;

  @Prop({ type: Array, default: [] })
  availability: any[];

  @Prop({ enum: ['active', 'inactive', 'suspended'], default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @Prop({ default: 0 })
  deletedAt: number;

  @Prop({ type: String, required: true })
  organization: string; // ref org id

  @Prop({ type: String, required: true })
  location: string; // ref location id
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create a compound index to ensure email uniqueness is scoped to organization and role
UserSchema.index(
  { email: 1, organization: 1, role: 1 },
  { unique: true }
);


