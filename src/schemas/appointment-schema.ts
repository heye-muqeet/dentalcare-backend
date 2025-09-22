import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SoftDeleteMixin, SoftDeleteDocument } from './base/soft-delete.schema';
import { AppointmentStatus, VisitType } from './appointment.enums';

export type AppointmentDocument = Appointment & Document & SoftDeleteDocument;

@Schema({ timestamps: true })
export class Appointment extends SoftDeleteMixin {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor' })
  doctorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Receptionist', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ required: true })
  startTime: string; // Format: "HH:MM"

  @Prop({ required: true })
  endTime: string; // Format: "HH:MM"

  @Prop({ 
    type: String, 
    enum: Object.values(AppointmentStatus), 
    default: AppointmentStatus.SCHEDULED 
  })
  status: AppointmentStatus;

  @Prop({ 
    type: String, 
    enum: Object.values(VisitType), 
    required: true 
  })
  visitType: VisitType;

  @Prop({ required: true, trim: true })
  reasonForVisit: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: 30 })
  duration: number; // in minutes

  @Prop({ type: Date })
  treatmentStartedAt?: Date;

  @Prop({ type: Date })
  treatmentCompletedAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop({ trim: true })
  cancellationReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Doctor' })
  lastAssignedDoctor?: Types.ObjectId;

  @Prop({ type: Date })
  lastDoctorAssignmentAt?: Date;

  @Prop({ default: false })
  isWalkIn: boolean;

  @Prop({ default: false })
  isEmergency: boolean;

  @Prop({ type: Object })
  metadata?: {
    source?: string; // 'web', 'phone', 'walk_in', 'mobile_app'
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    reminderSent?: boolean;
    confirmationSent?: boolean;
    followUpRequired?: boolean;
  };
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Indexes for better query performance
AppointmentSchema.index({ patientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ branchId: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1, appointmentDate: 1 });
AppointmentSchema.index({ appointmentDate: 1, startTime: 1 });
AppointmentSchema.index({ organizationId: 1, appointmentDate: 1 });

// Compound index to prevent double booking
AppointmentSchema.index(
  { 
    doctorId: 1, 
    appointmentDate: 1, 
    startTime: 1, 
    status: 1 
  },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
      doctorId: { $exists: true }
    }
  }
);

// Compound index to prevent patient double booking
AppointmentSchema.index(
  { 
    patientId: 1, 
    appointmentDate: 1, 
    startTime: 1, 
    status: 1 
  },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] }
    }
  }
);
