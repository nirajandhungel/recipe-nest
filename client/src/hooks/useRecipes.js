import { useState, useCallback } from 'react';
import { recipeApi } from '../api/recipeApi';
import toast from 'react-hot-toast';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const extractRecipes = (data) => {
    if (Array.isArray(data.data)) return data.data;
    if (data.data?.recipes) return data.data.recipes;
    if (data.recipes) return data.recipes;
    return [];
  };

  const extractMeta = (data) => ({
    page: data.meta?.page || data.data?.page || 1,
    totalPages: data.meta?.totalPages || data.data?.totalPages || 1,
    total: data.meta?.total || data.data?.total || 0,
  });

  const fetchRecipes = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await recipeApi.getAll(params);
      setRecipes(extractRecipes(data));
      setPagination(extractMeta(data));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipe = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await recipeApi.getById(id);
      setRecipe(data.data || data.recipe || data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Recipe not found');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (id) => {
    await recipeApi.delete(id);
    setRecipes((prev) => prev.filter((r) => r._id !== id));
    toast.success('Recipe deleted');
  }, []);

  const publishRecipe = useCallback(async (id) => {
    await recipeApi.publish(id);
    setRecipes((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: 'published', isPublished: true } : r))
    );
    toast.success('Recipe published!');
  }, []);

  return { recipes, recipe, loading, pagination, fetchRecipes, fetchRecipe, deleteRecipe, publishRecipe };
};
