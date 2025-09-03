import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from '../schemas/payment.schema';
import { Invoice } from '../schemas/invoice.schema';
import { Patient } from '../schemas/patient.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
  ) {}

  async create(payload: Partial<Payment>) {
    const payment = await this.paymentModel.create(payload);
    const invoice = await this.invoiceModel.findById(payment.invoiceId).lean();
    if (invoice) {
      const payments = await this.paymentModel.aggregate([
        { $match: { invoiceId: payment.invoiceId } },
        { $group: { _id: '$invoiceId', total: { $sum: '$amount' } } },
      ]);
      const paidTotal = payments[0]?.total || 0;
      if (paidTotal >= (invoice.total || 0)) {
        await this.invoiceModel.updateOne({ _id: payment.invoiceId }, { $set: { status: 'paid' } });
      }
      await this.patientModel.updateOne({ _id: payment.patientId }, { $inc: { balance: -(payment.amount || 0) } });
    }
    return payment;
  }
}


