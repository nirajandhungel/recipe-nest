import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeApi } from '../../api/recipeApi';
import RecipeForm from '../../components/recipe/RecipeForm';
import toast from 'react-hot-toast';
import { PlusCircle } from 'lucide-react';

const CreateRecipe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // FIX: accept imageFile as second argument from RecipeForm
  const handleSubmit = async (data, imageFile) => {
    setLoading(true);
    try {
      const { data: res } = await recipeApi.create(data, imageFile);
      const id = res.data?.recipe?._id || res.data?._id || res._id;
      toast.success('Recipe created!');
      navigate('/chef/recipes');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <PlusCircle className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Create New Recipe</h1>
      </div>
      <RecipeForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};

export default CreateRecipe;