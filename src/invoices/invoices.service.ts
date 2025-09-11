import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from '../schemas/invoice.schema';
import { Patient } from '../schemas/patient.schema';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
  ) {}

  list(organization: string, filters: any) {
    const query: any = { organization };
    if (filters.status) query.status = filters.status;
    if (filters.patient) query.patient = filters.patient;
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }
    return this.invoiceModel.find(query).lean();
  }

  async markPaid(id: string) {
    const invoice = await this.invoiceModel.findById(id).lean();
    if (!invoice) return null;
    await this.invoiceModel.updateOne({ _id: id }, { $set: { status: 'paid' } });
    await this.patientModel.updateOne({ _id: invoice.patient }, { $inc: { balance: -invoice.total } });
    return { success: true };
  }
}


