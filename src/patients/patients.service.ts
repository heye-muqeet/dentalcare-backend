import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient } from '../schemas/patient.schema';

@Injectable()
export class PatientsService {
  constructor(@InjectModel(Patient.name) private readonly patientModel: Model<Patient>) {}

  async list(organization: string, query: { page?: number; limit?: number; search?: string; status?: string }) {
    try {
      console.log(`Patients service: Listing patients for organization ${organization}`);
      
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;
      
      // Add filter for deletedAt = 0 to only show active patients
      const filter: any = { 
        organization,
        deletedAt: 0 // Only show active patients (not deleted)
      };
      
      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: 'i' } },
          { email: { $regex: query.search, $options: 'i' } },
          { phone: { $regex: query.search, $options: 'i' } },
        ];
      }
      
      console.log('Patients service: Using filter:', filter);
      
      const [items, total] = await Promise.all([
        this.patientModel.find(filter).skip(skip).limit(limit).lean(),
        this.patientModel.countDocuments(filter),
      ]);
      
      console.log(`Patients service: Found ${items.length} patients out of ${total} total`);
      
      // Ensure each patient has an id field (MongoDB returns _id)
      const formattedItems = items.map(item => {
        const { _id, ...rest } = item;
        return { id: _id.toString(), ...rest };
      });
      
      return { items: formattedItems, total, page, limit };
    } catch (error) {
      console.error('Patients service: Error listing patients:', error);
      throw error;
    }
  }

  async create(payload: Partial<Patient>) {
    try {
      // Check if patient with this email already exists in this organization
      const existingPatient = await this.patientModel.findOne({
        email: payload.email,
        organization: payload.organization
      });
      
      if (existingPatient) {
        throw new Error('A patient with this email already exists in your organization');
      }
      
      return this.patientModel.create(payload);
    } catch (error) {
      console.error('Error creating patient:', error);
      // Check for duplicate key error (MongoDB E11000)
      if (error.message.includes('E11000') || error.message.includes('duplicate key')) {
        throw new Error('A patient with this email already exists in your organization');
      }
      throw error;
    }
  }

  async details(id: string) {
    return this.patientModel.findById(id).lean();
  }
}


