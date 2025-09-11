import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async list(organization: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userModel.find({ organization }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments({ organization }),
    ]);
    return { items, total, page, limit };
  }

  async create(ownerId: string, payload: Partial<User>) {
    try {
      // Validate required fields
      if (!payload.email || !payload.password || !payload.name || !payload.phone) {
        throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
      }
      
      // Check if email already exists within the same organization with the same role
      console.log('Validating email uniqueness with:', { 
        email: payload.email, 
        organization: payload.organization,
        role: payload.role
      });
      
      const existingUser = await this.userModel.findOne({ 
        email: payload.email, 
        organization: payload.organization,
        role: payload.role
      });
      
      if (existingUser) {
        console.log('Duplicate user found:', existingUser);
        throw new HttpException('Email already in use with this role in this organization', HttpStatus.BAD_REQUEST);
      } else {
        console.log('No duplicate user found, proceeding with creation');
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(payload.password, 10);
      
      // Create user with hashed password
      const user = await this.userModel.create({
        ...payload,
        password: hashedPassword,
        status: 'active'
      });
      
      // Return user without password
      const userObject = user.toObject();
      const { password, ...userWithoutPassword } = userObject;
      
      return userWithoutPassword;
    } catch (error) {
      console.error('Error creating user:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async update(id: string, payload: Partial<User>) {
    await this.userModel.updateOne({ _id: id }, { $set: payload });
    return this.userModel.findById(id).lean();
  }

  async listDoctors(organization: string) {
    console.log('Fetching doctors for organization:', organization);
    const doctors = await this.userModel.find({ organization, role: 'doctor' }).lean();
    console.log(`Found ${doctors.length} doctors:`, doctors);
    return { items: doctors }; // Return in a consistent format matching other endpoints
  }

  async delete(id: string) {
    await this.userModel.updateOne({ _id: id }, { $set: { deletedAt: Date.now() } });
    return { success: true };
  }
}


