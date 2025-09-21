import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(@Request() req: any) {
    try {
      console.log('CategoriesController.getCategories called:', { user: req.user });
      
      const user = req.user;
      const organizationId = typeof user.organizationId === 'string' 
        ? user.organizationId 
        : user.organizationId?._id || user.organizationId?.id;
      
      console.log('Extracted organizationId:', organizationId);
      
      const categories = await this.categoriesService.getOrganizationCategories(
        organizationId,
        user.role,
        user.branchId
      );
      
      return {
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      };
    } catch (error) {
      console.error('CategoriesController.getCategories error:', error);
      throw error;
    }
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string, @Request() req: any) {
    try {
      console.log('CategoriesController.getCategoryById called:', { categoryId: id, user: req.user });
      
      const user = req.user;
      const organizationId = typeof user.organizationId === 'string' 
        ? user.organizationId 
        : user.organizationId?._id || user.organizationId?.id;
      
      const category = await this.categoriesService.getCategoryById(
        id,
        organizationId,
        user.role,
        user.branchId
      );
      
      return {
        success: true,
        data: category,
        message: 'Category retrieved successfully'
      };
    } catch (error) {
      console.error('CategoriesController.getCategoryById error:', error);
      throw error;
    }
  }

  @Post()
  async createCategory(
    @Request() req: any,
    @Body() createCategoryDto: any
  ) {
    console.log('CategoriesController.createCategory called:', { categoryData: createCategoryDto });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const category = await this.categoriesService.createCategory(
      createCategoryDto,
      organizationId,
      user.userId,
      user.role
    );

    return {
      success: true,
      message: 'Category created successfully',
      data: category
    };
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateCategoryDto: any
  ) {
    console.log('CategoriesController.updateCategory called:', { categoryId: id, categoryData: updateCategoryDto });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const category = await this.categoriesService.updateCategory(
      id,
      updateCategoryDto,
      organizationId,
      user.role
    );

    return {
      success: true,
      message: 'Category updated successfully',
      data: category
    };
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string, @Request() req: any) {
    console.log('CategoriesController.deleteCategory called:', { categoryId: id });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    await this.categoriesService.deleteCategory(
      id,
      organizationId,
      user.role
    );

    return {
      success: true,
      message: 'Category deleted successfully'
    };
  }

  @Patch(':id/restore')
  async restoreCategory(@Param('id') id: string, @Request() req: any) {
    console.log('CategoriesController.restoreCategory called:', { categoryId: id });
    
    const user = req.user;
    const organizationId = typeof user.organizationId === 'string' 
      ? user.organizationId 
      : user.organizationId?._id || user.organizationId?.id;

    const category = await this.categoriesService.restoreCategory(
      id,
      organizationId,
      user.role
    );

    return {
      success: true,
      message: 'Category restored successfully',
      data: category
    };
  }
}
