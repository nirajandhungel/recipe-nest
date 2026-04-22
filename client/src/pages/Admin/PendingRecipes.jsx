import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatDate, difficultyColor } from '../../utils/helpers';
import { FileWarning, Check, X, Flag, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PendingRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    adminApi.getPendingRecipes()
      .then(({ data }) => setRecipes(data.data?.recipes || data.recipes || []))
      .catch(() => toast.error('Failed to load pending recipes'))
      .finally(() => setLoading(false));
  }, []);

  const setAL = (id, val) => setActionLoading((prev) => ({ ...prev, [id]: val }));

  const handleApprove = async (id) => {
    setAL(id, 'approve');
    try {
      await adminApi.approveRecipe(id);
      setRecipes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Recipe approved');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setAL(id, null); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setAL(rejectTarget._id, 'reject');
    try {
      await adminApi.rejectRecipe(rejectTarget._id, rejectReason);
      setRecipes((prev) => prev.filter((r) => r._id !== rejectTarget._id));
      setRejectTarget(null);
      setRejectReason('');
      toast.success('Recipe rejected');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setAL(rejectTarget?._id, null); }
  };

  const handleFlag = async (id) => {
    setAL(id, 'flag');
    try {
      await adminApi.flagRecipe(id);
      toast.success('Recipe flagged for review');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setAL(id, null); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <FileWarning className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Pending Recipes</h1>
        <span className="badge bg-brand-100 text-brand-700">{recipes.length}</span>
      </div>

      {loading ? <Loader /> : recipes.length === 0 ? (
        <div className="text-center py-16 text-surface-400">
          <Check className="w-10 h-10 mx-auto mb-3 text-emerald-400 opacity-60" />
          <p>All caught up! No pending recipes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const chef = recipe.chefId;
            return (
              <div key={recipe._id} className="card p-4">
                <div className="flex items-start gap-4">
                  {recipe.imageUrl && (
                    <img src={recipe.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{recipe.title}</h3>
                        <p className="text-xs text-surface-400 mt-0.5">
                          by {chef?.firstName} {chef?.lastName} · {formatDate(recipe.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge text-xs ${difficultyColor(recipe.difficulty)}`}>{recipe.difficulty}</span>
                        <span className="badge text-xs bg-surface-100 text-surface-600">{recipe.cuisineType}</span>
                      </div>
                    </div>
                    <p className="text-sm text-surface-500 mt-1 line-clamp-2">{recipe.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                  <Link to={`/recipes/${recipe._id}`} className="btn-ghost text-xs gap-1">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Link>
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => handleFlag(recipe._id)} disabled={!!actionLoading[recipe._id]}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors">
                      <Flag className="w-3.5 h-3.5" /> Flag
                    </button>
                    <button onClick={() => setRejectTarget(recipe)} disabled={!!actionLoading[recipe._id]}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button onClick={() => handleApprove(recipe._id)} disabled={!!actionLoading[recipe._id]}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                      {actionLoading[recipe._id] === 'approve' ? (
                        <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : <Check className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Recipe" size="sm">
        <p className="text-surface-600 mb-3">Rejecting: <span className="font-semibold">"{rejectTarget?.title}"</span></p>
        <textarea
          className="input-base resize-none h-24 mb-4"
          placeholder="Reason for rejection (optional)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={actionLoading[rejectTarget?._id] === 'reject'} onClick={handleReject}>Reject</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PendingRecipes;
