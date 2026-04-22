import { useState } from 'react';
import { Heart, Bookmark, UserPlus, UserMinus } from 'lucide-react';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const LikeButton = ({ recipeId, initialLiked = false, initialCount = 0 }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) { toast.error('Log in to like recipes'); return; }
    setLoading(true);
    try {
      if (liked) {
        await socialApi.unlike(recipeId);
        setLiked(false);
        setCount((c) => c - 1);
      } else {
        await socialApi.like(recipeId);
        setLiked(true);
        setCount((c) => c + 1);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        liked ? 'bg-red-50 text-red-500' : 'bg-surface-100 text-surface-600 hover:bg-red-50 hover:text-red-500'
      }`}
    >
      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      {count}
    </button>
  );
};

export const SaveButton = ({ recipeId, initialSaved = false, initialCount = 0 }) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) { toast.error('Log in to save recipes'); return; }
    setLoading(true);
    try {
      if (saved) {
        await socialApi.unsave(recipeId);
        setSaved(false);
        setCount((c) => c - 1);
      } else {
        await socialApi.save(recipeId);
        setSaved(true);
        setCount((c) => c + 1);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        saved ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-surface-600 hover:bg-brand-50 hover:text-brand-600'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
      {count}
    </button>
  );
};

export const FollowButton = ({ userId, initialFollowing = false }) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (user?._id === userId) return null;

  const toggle = async () => {
    if (!user) { toast.error('Log in to follow chefs'); return; }
    setLoading(true);
    try {
      if (following) {
        await socialApi.unfollow(userId);
        setFollowing(false);
        toast.success('Unfollowed');
      } else {
        await socialApi.follow(userId);
        setFollowing(true);
        toast.success('Following!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        following
          ? 'bg-surface-100 text-surface-700 hover:bg-red-50 hover:text-red-500'
          : 'bg-brand-500 text-white hover:bg-brand-600'
      }`}
    >
      {following ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
    </button>
  );
};
