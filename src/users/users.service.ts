import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

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
    const user = await this.userModel.create(payload);
    return user;
  }

  async update(id: string, payload: Partial<User>) {
    await this.userModel.updateOne({ _id: id }, { $set: payload });
    return this.userModel.findById(id).lean();
  }

  async listDoctors(organization: string) {
    return this.userModel.find({ organization, role: 'doctor' }).lean();
  }

  async delete(id: string) {
    await this.userModel.updateOne({ _id: id }, { $set: { deletedAt: Date.now() } });
    return { success: true };
  }
}


