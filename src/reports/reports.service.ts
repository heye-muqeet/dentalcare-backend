import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from '../schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(@InjectModel(Report.name) private readonly reportModel: Model<Report>) {}

  create(payload: Partial<Report>) {
    return this.reportModel.create(payload);
  }

  listByPatient(patientId: string) {
    return this.reportModel.find({ patient: patientId }).lean();
  }
}


