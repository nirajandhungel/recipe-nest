import { useEffect, useState } from 'react';
import { socialApi } from '../../api/socialApi';
import RecipeCard from '../../components/recipe/RecipeCard';
import Loader from '../../components/ui/Loader';
import { BookMarked } from 'lucide-react';

const SavedRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialApi.getMySaves()
      .then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : (data.data?.recipes || data.recipes || []);
        setRecipes(list);
      })
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BookMarked className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Saved Recipes</h1>
      </div>

      {loading ? <Loader /> : recipes.length === 0 ? (
        <div className="text-center py-16 text-surface-400">
          <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>You haven't saved any recipes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((r) => <RecipeCard key={r._id} recipe={r} />)}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
