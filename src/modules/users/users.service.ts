import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { SoftDeleteService } from '../../services/soft-delete.service';
import { SoftDeleteQueryOptions, SoftDeleteOptions, RestoreOptions } from '../../schemas/base/soft-delete.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private softDeleteService: SoftDeleteService
  ) {}

  async create(createUserDto: any): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(options: SoftDeleteQueryOptions = {}): Promise<User[]> {
    const filter = this.softDeleteService.buildSoftDeleteFilter({}, options);
    return this.userModel.find(filter).exec();
  }

  async findOne(id: string, options: SoftDeleteQueryOptions = {}): Promise<User | null> {
    const filter = this.softDeleteService.buildSoftDeleteFilter({ _id: id }, options);
    return this.userModel.findOne(filter).exec();
  }

  async findByEmail(email: string, options: SoftDeleteQueryOptions = {}): Promise<User | null> {
    const filter = this.softDeleteService.buildSoftDeleteFilter({ email }, options);
    return this.userModel.findOne(filter).exec();
  }

  async update(id: string, updateUserDto: any): Promise<User | null> {
    const filter = this.softDeleteService.buildSoftDeleteFilter({ _id: id });
    return this.userModel.findOneAndUpdate(filter, updateUserDto, { new: true }).exec();
  }

  async updateProfileImage(id: string, profileImage: string, profileImagePublicId: string): Promise<User | null> {
    const filter = this.softDeleteService.buildSoftDeleteFilter({ _id: id });
    return this.userModel.findOneAndUpdate(
      filter, 
      { profileImage, profileImagePublicId }, 
      { new: true }
    ).exec();
  }

  // Soft delete methods
  async softDelete(
    id: string, 
    options: SoftDeleteOptions, 
    auditContext?: any
  ): Promise<User | null> {
    return this.softDeleteService.softDelete(this.userModel, id, options, auditContext);
  }

  async restore(
    id: string, 
    options: RestoreOptions, 
    auditContext?: any
  ): Promise<User | null> {
    return this.softDeleteService.restore(this.userModel, id, options, auditContext);
  }

  async permanentDelete(id: string, auditContext?: any): Promise<User | null> {
    return this.softDeleteService.permanentDelete(this.userModel, id, auditContext);
  }

  // Legacy method for backward compatibility - now does soft delete
  async remove(id: string, options: SoftDeleteOptions = {}, auditContext?: any): Promise<User | null> {
    return this.softDeleteService.softDelete(this.userModel, id, options, auditContext);
  }

  // Get soft delete statistics
  async getDeleteStats(organizationId?: string, branchId?: string) {
    return this.softDeleteService.getDeleteStats(this.userModel, organizationId, branchId);
  }
}
