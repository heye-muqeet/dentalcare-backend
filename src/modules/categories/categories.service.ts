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
      organizationIdType: typeof organizationId,
      userRole,
      userBranchId
    });

    // Categories are organization-specific, no special handling for super_admin

    // OrganizationId is required for all users
    if (!organizationId || organizationId === 'undefined') {
      console.log('No valid organizationId provided');
      return [];
    }

    const organizationObjectId = new Types.ObjectId(organizationId);
    console.log('Converted organizationObjectId:', organizationObjectId.toString());
    
    // First, let's check what categories exist in the database (for debugging)
    const allCategories = await this.categoryModel.find({}).exec();
    console.log('Total categories in database:', allCategories.length);
    console.log('All categories organizationIds:', allCategories.map(cat => ({
      id: cat._id,
      name: cat.name,
      organizationId: cat.organizationId,
      organizationIdType: typeof cat.organizationId
    })));
    
    // All authenticated users can view categories for their organization
    const categories = await this.categoryModel.find({ 
      organizationId: organizationObjectId,
      isDeleted: false 
    }).sort({ name: 1 }).exec();
    
    console.log('Query used:', { 
      organizationId: organizationObjectId,
      isDeleted: false 
    });
    console.log('Found categories:', categories.length);
    console.log('Categories found:', categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      organizationId: cat.organizationId
    })));
    
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
    
    if (!organizationId || organizationId === 'undefined') {
      throw new NotFoundException('Organization ID required');
    }
    
    const organizationObjectId = new Types.ObjectId(organizationId);
    
    const query: any = {
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: false
    };
    
    const category = await this.categoryModel.findOne(query).exec();

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
      organizationIdType: typeof organizationId,
      createdBy,
      userRole,
      categoryName: createCategoryDto.name
    });

    // Check permissions - only organization_admin can create categories
    if (userRole !== 'organization_admin') {
      throw new ForbiddenException('Only organization administrators can create categories');
    }

    if (!organizationId || organizationId === 'undefined') {
      throw new ForbiddenException('Organization ID is required');
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
      organizationId: categoryData.organizationId.toString(),
      organizationIdType: typeof categoryData.organizationId,
      fullData: categoryData
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

    // Check permissions - only organization_admin can update categories
    if (userRole !== 'organization_admin') {
      throw new ForbiddenException('Only organization administrators can update categories');
    }

    if (!organizationId || organizationId === 'undefined') {
      throw new ForbiddenException('Organization ID is required');
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const organizationObjectId = new Types.ObjectId(organizationId);
    
    const query: any = {
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: false
    };

    // Check if category exists
    const existingCategory = await this.categoryModel.findOne(query).exec();

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // If updating name, check for duplicates
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      let duplicateQuery: any = {
        name: updateCategoryDto.name,
        organizationId: existingCategory.organizationId, // Use the existing category's organizationId
        isDeleted: false,
        _id: { $ne: categoryObjectId }
      };

      const duplicateCategory = await this.categoryModel.findOne(duplicateQuery).exec();

      if (duplicateCategory) {
        throw new ConflictException('Category with this name already exists in the organization');
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

    // Check permissions - only organization_admin can delete categories
    if (userRole !== 'organization_admin') {
      throw new ForbiddenException('Only organization administrators can delete categories');
    }

    if (!organizationId || organizationId === 'undefined') {
      throw new ForbiddenException('Organization ID is required');
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const organizationObjectId = new Types.ObjectId(organizationId);
    
    const query: any = {
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: false
    };

    // Check if category exists
    const category = await this.categoryModel.findOne(query).exec();

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

    // Check permissions - only organization_admin can restore categories
    if (userRole !== 'organization_admin') {
      throw new ForbiddenException('Only organization administrators can restore categories');
    }

    if (!organizationId || organizationId === 'undefined') {
      throw new ForbiddenException('Organization ID is required');
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const organizationObjectId = new Types.ObjectId(organizationId);
    
    const query: any = {
      _id: categoryObjectId,
      organizationId: organizationObjectId,
      isDeleted: true
    };

    // Check if category exists and is deleted
    const category = await this.categoryModel.findOne(query).exec();

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
