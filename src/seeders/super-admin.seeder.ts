import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SuperAdmin, SuperAdminDocument } from '../schemas/super-admin.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SuperAdminSeeder {
  constructor(
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
  ) {}

  async seed() {
    const existingSuperAdmin = await this.superAdminModel.findOne({ email: 'superadmin@dentalcare.com' }).exec();
    
    if (existingSuperAdmin) {
      console.log('Super Admin already exists');
      return existingSuperAdmin;
    }

    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
    
    const superAdmin = new this.superAdminModel({
      username: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@dentalcare.com',
      password: hashedPassword,
      isActive: true,
      role: 'super_admin',
    });

    const savedSuperAdmin = await superAdmin.save();
    console.log('Super Admin created successfully:', savedSuperAdmin.email);
    
    return savedSuperAdmin;
  }
}
