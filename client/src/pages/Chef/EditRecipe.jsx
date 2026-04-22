import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipeApi } from '../../api/recipeApi';
import RecipeForm from '../../components/recipe/RecipeForm';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import { Edit2 } from 'lucide-react';

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    recipeApi
      .getById(id)
      .then(({ data }) => {
        const r = data.data || data.recipe || data;
        // Normalize tags array to comma string for the form input
        setRecipe({ ...r, tags: Array.isArray(r.tags) ? r.tags.join(', ') : r.tags || '' });
      })
      .catch(() => toast.error('Recipe not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // FIX: accept imageFile as second argument from RecipeForm
  const handleSubmit = async (data, imageFile) => {
    setSaving(true);
    try {
      await recipeApi.update(id, data, imageFile);
      toast.success('Recipe updated!');
      navigate('/chef/recipes');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (!recipe) return <p className="text-surface-400">Recipe not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Edit2 className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Edit Recipe</h1>
      </div>
      <RecipeForm defaultValues={recipe} onSubmit={handleSubmit} loading={saving} />
    </div>
  );
};

export default EditRecipe;