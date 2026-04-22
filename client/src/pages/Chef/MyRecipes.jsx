import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recipeApi } from '../../api/recipeApi';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../hooks/useRecipes';
import Loader from '../../components/ui/Loader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { difficultyColor, statusColor, formatDate } from '../../utils/helpers';
import { PlusCircle, Edit2, Trash2, Send, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const MyRecipes = () => {
  const { user } = useAuth();
  const { recipes, loading, fetchRecipes, deleteRecipe, publishRecipe } = useRecipes();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?._id) fetchRecipes({ chefId: user._id, limit: 50 });
  }, [user?._id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(deleteTarget._id);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (recipe) => {
    try {
      await publishRecipe(recipe._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Publish failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">My Recipes</h1>
        <Link to="/chef/recipes/create" className="btn-primary">
          <PlusCircle className="w-4 h-4" /> New Recipe
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-surface-400 mb-4">You haven't created any recipes yet.</p>
          <Link to="/chef/recipes/create" className="btn-primary">Create Your First Recipe</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-800 text-left">
                <th className="px-4 py-3 font-semibold text-surface-600">Recipe</th>
                <th className="px-4 py-3 font-semibold text-surface-600 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 font-semibold text-surface-600 hidden md:table-cell">Difficulty</th>
                <th className="px-4 py-3 font-semibold text-surface-600 hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 font-semibold text-surface-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe._id} className="border-b border-surface-50 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {recipe.imageUrl ? (
                        <img src={recipe.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-200 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{recipe.title}</p>
                        <p className="text-xs text-surface-400">{recipe.cuisineType} · {recipe.mealType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`badge text-xs ${statusColor(recipe.status)}`}>{recipe.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`badge text-xs ${difficultyColor(recipe.difficulty)}`}>{recipe.difficulty}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-surface-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(recipe.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/recipes/${recipe._id}`} className="p-1.5 rounded-lg text-surface-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/chef/recipes/${recipe._id}/edit`} className="p-1.5 rounded-lg text-surface-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      {recipe.status === 'draft' && (
                        <button onClick={() => handlePublish(recipe)} className="p-1.5 rounded-lg text-surface-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Publish">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(recipe)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Recipe" size="sm">
        <p className="text-surface-600 mb-5">
          Are you sure you want to delete <span className="font-semibold">"{deleteTarget?.title}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default MyRecipes;
