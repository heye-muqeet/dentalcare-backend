import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async getOrganizationCategories(
    organizationId: string,
    userRole: string,
    userBranchId?: string
  ): Promise<Category[]> {
    console.log('CategoriesService.getOrganizationCategories called:', {
      organizationId,
      userRole,
      userBranchId
    });

    const organizationObjectId = new Types.ObjectId(organizationId);
    
    // All authenticated users can view categories for their organization
    const categories = await this.categoryModel.find({ 
      organizationId: organizationObjectId,
      isDeleted: false 
    }).sort({ name: 1 }).exec();
    
    console.log('Found categories:', categories.length);
    return categories;
  }

  async getCategoryById(
    categoryId: string,
    organizationId: string,
    userRole: string,
    userBranchId?: string
  ): Promise<Category> {
    console.log('CategoriesService.getCategoryById called:', {
      categoryId,
      organizationId,
      userRole
    });

    const categoryObjectId = new Types.ObjectId(categoryId);
    const organizationObjectId = new Types.ObjectId(organizationId);
    
    const category = await this.categoryModel.findOne({
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: false
    }).exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(
    createCategoryDto: any,
    organizationId: string,
    createdBy: string,
    userRole: string
  ): Promise<Category> {
    console.log('CategoriesService.createCategory called:', {
      organizationId,
      createdBy,
      userRole,
      categoryName: createCategoryDto.name
    });

    // Check permissions - only organization_admin and super_admin can create categories
    if (userRole === 'super_admin') {
      // Super admin can create categories for any organization
    } else if (userRole === 'organization_admin') {
      // Organization admin can create categories for their organization
    } else {
      throw new ForbiddenException('Insufficient permissions to create category');
    }

    const organizationObjectId = new Types.ObjectId(organizationId);

    // Check if category name already exists in this organization
    const existingCategory = await this.categoryModel.findOne({ 
      name: createCategoryDto.name, 
      organizationId: organizationObjectId,
      isDeleted: false
    }).exec();
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists in your organization');
    }

    // Create category
    const categoryData = {
      ...createCategoryDto,
      organizationId: organizationObjectId,
      createdBy: new Types.ObjectId(createdBy)
    };

    console.log('Creating category with data:', {
      name: categoryData.name,
      organizationId: categoryData.organizationId.toString()
    });

    const category = new this.categoryModel(categoryData);
    const savedCategory = await category.save();
    console.log('Category created successfully:', {
      id: savedCategory._id,
      name: savedCategory.name
    });

    return savedCategory;
  }

  async updateCategory(
    categoryId: string,
    updateCategoryDto: any,
    organizationId: string,
    userRole: string
  ): Promise<Category> {
    console.log('CategoriesService.updateCategory called:', {
      categoryId,
      organizationId,
      userRole
    });

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can update categories for any organization
    } else if (userRole === 'organization_admin') {
      // Organization admin can update categories for their organization
    } else {
      throw new ForbiddenException('Insufficient permissions to update category');
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const organizationObjectId = new Types.ObjectId(organizationId);

    // Check if category exists
    const existingCategory = await this.categoryModel.findOne({
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: false
    }).exec();

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // If updating name, check for duplicates
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const duplicateCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        organizationId: organizationObjectId,
        isDeleted: false,
        _id: { $ne: categoryObjectId }
      }).exec();

      if (duplicateCategory) {
        throw new ConflictException('Category with this name already exists in your organization');
      }
    }

    // Update category
    const updatedCategory = await this.categoryModel.findByIdAndUpdate(
      categoryObjectId,
      updateCategoryDto,
      { new: true }
    ).exec();

    if (!updatedCategory) {
      throw new NotFoundException('Category not found after update');
    }

    console.log('Category updated successfully:', {
      id: updatedCategory._id,
      name: updatedCategory.name
    });

    return updatedCategory;
  }

  async deleteCategory(
    categoryId: string,
    organizationId: string,
    userRole: string
  ): Promise<void> {
    console.log('CategoriesService.deleteCategory called:', {
      categoryId,
      organizationId,
      userRole
    });

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can delete categories for any organization
    } else if (userRole === 'organization_admin') {
      // Organization admin can delete categories for their organization
    } else {
      throw new ForbiddenException('Insufficient permissions to delete category');
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const organizationObjectId = new Types.ObjectId(organizationId);

    // Check if category exists
    const category = await this.categoryModel.findOne({
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: false
    }).exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Soft delete the category
    await this.categoryModel.findByIdAndUpdate(
      categoryObjectId,
      { isDeleted: true, deletedAt: new Date() }
    ).exec();

    console.log('Category soft deleted successfully:', {
      id: categoryObjectId
    });
  }

  async restoreCategory(
    categoryId: string,
    organizationId: string,
    userRole: string
  ): Promise<Category> {
    console.log('CategoriesService.restoreCategory called:', {
      categoryId,
      organizationId,
      userRole
    });

    // Check permissions
    if (userRole === 'super_admin') {
      // Super admin can restore categories for any organization
    } else if (userRole === 'organization_admin') {
      // Organization admin can restore categories for their organization
    } else {
      throw new ForbiddenException('Insufficient permissions to restore category');
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const organizationObjectId = new Types.ObjectId(organizationId);

    // Check if category exists and is deleted
    const category = await this.categoryModel.findOne({
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: true
    }).exec();

    if (!category) {
      throw new NotFoundException('Deleted category not found');
    }

    // Restore the category
    const restoredCategory = await this.categoryModel.findByIdAndUpdate(
      categoryObjectId,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).exec();

    if (!restoredCategory) {
      throw new NotFoundException('Category not found after restore');
    }

    console.log('Category restored successfully:', {
      id: restoredCategory._id,
      name: restoredCategory.name
    });

    return restoredCategory;
  }

  async incrementUsageCount(categoryId: string): Promise<void> {
    await this.categoryModel.findByIdAndUpdate(
      categoryId,
      { $inc: { usageCount: 1 } }
    ).exec();
  }

  async decrementUsageCount(categoryId: string): Promise<void> {
    await this.categoryModel.findByIdAndUpdate(
      categoryId,
      { $inc: { usageCount: -1 } }
    ).exec();
  }
}
