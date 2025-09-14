import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BranchAdminDocument = BranchAdmin & Document;

@Schema({ timestamps: true })
export class BranchAdmin {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OrganizationAdmin', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: 'branch_admin' })
  role: string;

  @Prop()
  profileImage?: string;

  @Prop()
  profileImagePublicId?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ trim: true })
  employeeId?: string;
}

export const BranchAdminSchema = SchemaFactory.createForClass(BranchAdmin);
