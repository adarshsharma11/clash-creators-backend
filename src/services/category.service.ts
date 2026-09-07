import { db } from '../utils/db.server';
import { TCategorySchema, TCategoryID, TCategoryUpdate } from '../types/category';

export const createCategory = async (data: TCategorySchema) => {
  return db.category.create({ data });
};

export const getCategories = async () => {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
};

export const getCategoryById = async (id: TCategoryID) => {
  return db.category.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });
};

export const updateCategory = async (id: TCategoryID, data: TCategoryUpdate) => {
  return db.category.update({ where: { id }, data });
};

export const deleteCategory = async (id: TCategoryID) => {
  return db.category.delete({ where: { id } });
};
