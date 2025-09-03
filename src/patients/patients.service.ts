import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient } from '../schemas/patient.schema';

@Injectable()
export class PatientsService {
  constructor(@InjectModel(Patient.name) private readonly patientModel: Model<Patient>) {}

  async list(organization: string, query: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter: any = { organization };
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.patientModel.find(filter).skip(skip).limit(limit).lean(),
      this.patientModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async create(payload: Partial<Patient>) {
    return this.patientModel.create(payload);
  }

  async details(id: string) {
    return this.patientModel.findById(id).lean();
  }
}


