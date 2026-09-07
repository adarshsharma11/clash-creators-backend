import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service';
import { categorySchema, categoryUpdateSchema } from '../types/category';
import { sendSuccessResponse, sendNotFoundResponse } from '../utils/responseHandler';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = categorySchema.parse(req.body);
    const category = await categoryService.createCategory(parsed);
    return sendSuccessResponse(res, category, 201);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getCategories();
    return sendSuccessResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return sendNotFoundResponse(res, 'Category not found');
    }
    return sendSuccessResponse(res, category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = categoryUpdateSchema.parse(req.body);
    const category = await categoryService.updateCategory(req.params.id, parsed);
    return sendSuccessResponse(res, category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return sendSuccessResponse(res, { message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
