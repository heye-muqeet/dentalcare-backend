import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Treatment } from '../schemas/treatment.schema';
import { Invoice } from '../schemas/invoice.schema';
import { Patient } from '../schemas/patient.schema';
import { Appointment } from '../schemas/appointment.schema';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectModel(Treatment.name) private readonly treatmentModel: Model<Treatment>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
  ) {}

  private generateInvoiceNumber(date: Date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `INV-${y}${m}-${rand}`;
  }

  async create(payload: any) {
    const subtotal = (payload.servicesUsed || []).reduce((sum: number, s: any) => sum + (s.price || 0), 0) + (payload.fee || 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;

    const treatment = await this.treatmentModel.create(payload);

    const now = new Date();
    const invoice = await this.invoiceModel.create({
      invoiceNumber: this.generateInvoiceNumber(now),
      date: now,
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      subtotal,
      tax,
      total,
      status: 'due',
      notes: '',
      services: payload.servicesUsed || [],
      organization: payload.organization,
      location: payload.location,
      patient: payload.patient,
      treatment: treatment._id.toString(),
    });

    await this.treatmentModel.updateOne({ _id: treatment._id }, { $set: { invoice: invoice._id.toString() } });
    await this.patientModel.updateOne({ _id: payload.patient }, { $inc: { balance: total } });

    await this.appointmentModel.updateOne({ _id: payload.appointment }, { $set: { status: 'completed' } });

    if (payload.followUpRecommended && payload.followUpDate && payload.followUpTime) {
      const timestamp = new Date(payload.followUpDate);
      const [h, m] = (payload.followUpTime as string).split(':');
      timestamp.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      await this.appointmentModel.create({
        date: payload.followUpDate,
        time: payload.followUpTime,
        reason: `Follow-up for treatment ${treatment._id.toString()}`,
        appointmentTimestamp: timestamp.getTime(),
        status: 'pending',
        notes: '',
        fee: payload.fee || 1000,
        organization: payload.organization,
        location: payload.location,
        patient: payload.patient,
        doctor: payload.doctor,
        addedBy: payload.doctor,
        followUpFor: payload.appointment,
      });
    }

    return { treatment, invoice };
  }

  list(filters: any, user: any) {
    const query: any = { organization: user.organizationId };
    if (user.role === 'doctor') query.doctor = user.id;
    return this.treatmentModel.find(query).lean();
  }
}


