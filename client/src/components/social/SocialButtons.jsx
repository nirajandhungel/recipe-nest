import { useState, useEffect, useRef } from 'react';
import { Heart, Bookmark, UserPlus, UserMinus } from 'lucide-react';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/* ─── shared keyframes (injected once) ─── */
const STYLE_ID = 'social-btn-animations';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes social-pop {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.35); }
      60%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes social-heart-burst {
      0%   { transform: scale(1); opacity: 1; }
      50%  { transform: scale(1.5); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    .social-pop { animation: social-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .social-heart-burst { animation: social-heart-burst 0.35s ease-out; }
  `;
  document.head.appendChild(style);
}

/* ════════════════════════════════════════════════
   LIKE BUTTON — Instagram‑style red heart
   ════════════════════════════════════════════════ */
export const LikeButton = ({ recipeId, initialLiked = false, initialCount = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const mounted = useRef(true);

  // Check initial liked state from server
  useEffect(() => {
    mounted.current = true;
    if (user && recipeId) {
      socialApi.isLiked(recipeId)
        .then(({ data }) => {
          if (mounted.current) setLiked(data.data?.liked ?? data.liked ?? false);
        })
        .catch(() => {});
    }
    return () => { mounted.current = false; };
  }, [user, recipeId]);

  const toggle = async () => {
    if (!user) { toast.error('Log in to like recipes'); navigate('/auth/login'); return; }
    if (loading) return;

    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    setAnimating(!wasLiked); // only animate on "like"

    setLoading(true);
    try {
      if (wasLiked) {
        const { data } = await socialApi.unlike(recipeId);
        if (mounted.current && data.data?.count !== undefined) setCount(data.data.count);
      } else {
        const { data } = await socialApi.like(recipeId);
        if (mounted.current && data.data?.count !== undefined) setCount(data.data.count);
      }
    } catch (err) {
      // Revert on error
      if (mounted.current) {
        setLiked(wasLiked);
        setCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
      }
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      if (mounted.current) setLoading(false);
      setTimeout(() => { if (mounted.current) setAnimating(false); }, 400);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        liked
          ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
          : 'bg-surface-100 text-surface-600 hover:bg-red-50 hover:text-red-500 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-red-500/10 dark:hover:text-red-400'
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${liked ? 'fill-current text-red-500' : ''} ${animating ? 'social-heart-burst' : ''}`}
      />
      {count}
    </button>
  );
};

/* ════════════════════════════════════════════════
   SAVE BUTTON — Instagram‑style filled bookmark
   ════════════════════════════════════════════════ */
export const SaveButton = ({ recipeId, initialSaved = false, initialCount = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const mounted = useRef(true);

  // Check initial saved state from server
  useEffect(() => {
    mounted.current = true;
    if (user && recipeId) {
      socialApi.isSaved(recipeId)
        .then(({ data }) => {
          if (mounted.current) setSaved(data.data?.saved ?? data.saved ?? false);
        })
        .catch(() => {});
    }
    return () => { mounted.current = false; };
  }, [user, recipeId]);

  const toggle = async () => {
    if (!user) { toast.error('Log in to save recipes'); navigate('/auth/login'); return; }
    if (loading) return;

    const wasSaved = saved;
    setSaved(!wasSaved);
    setCount((c) => wasSaved ? Math.max(0, c - 1) : c + 1);
    setAnimating(!wasSaved);

    setLoading(true);
    try {
      if (wasSaved) {
        const { data } = await socialApi.unsave(recipeId);
        if (mounted.current && data.data?.count !== undefined) setCount(data.data.count);
      } else {
        const { data } = await socialApi.save(recipeId);
        if (mounted.current && data.data?.count !== undefined) setCount(data.data.count);
      }
    } catch (err) {
      if (mounted.current) {
        setSaved(wasSaved);
        setCount((c) => wasSaved ? c + 1 : Math.max(0, c - 1));
      }
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      if (mounted.current) setLoading(false);
      setTimeout(() => { if (mounted.current) setAnimating(false); }, 400);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        saved
          ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
          : 'bg-surface-100 text-surface-600 hover:bg-brand-50 hover:text-brand-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400'
      }`}
    >
      <Bookmark
        className={`w-4 h-4 transition-all duration-200 ${saved ? 'fill-current' : ''} ${animating ? 'social-pop' : ''}`}
      />
      {count}
    </button>
  );
};

/* ════════════════════════════════════════════════
   FOLLOW BUTTON — Instagram‑style with count sync
   ════════════════════════════════════════════════ */
export const FollowButton = ({ userId, initialFollowing = false, onFollowChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const mounted = useRef(true);

  // Sync if parent passes updated initialFollowing
  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  if (!userId || user?._id === userId) return null;

  const toggle = async () => {
    if (!user) { toast.error('Log in to follow chefs'); navigate('/auth/login'); return; }
    if (loading) return;

    const wasFollowing = following;
    // Optimistic update
    setFollowing(!wasFollowing);
    setAnimating(true);

    // Optimistically notify parent about count change
    if (onFollowChange) {
      onFollowChange(!wasFollowing, wasFollowing ? -1 : 1);
    }

    setLoading(true);
    try {
      if (wasFollowing) {
        const { data } = await socialApi.unfollow(userId);
        if (mounted.current && onFollowChange && data.data?.followerCount !== undefined) {
          onFollowChange(false, 0, data.data.followerCount);
        }
      } else {
        const { data } = await socialApi.follow(userId);
        if (mounted.current && onFollowChange && data.data?.followerCount !== undefined) {
          onFollowChange(true, 0, data.data.followerCount);
        }
      }
    } catch (err) {
      // Revert on error
      if (mounted.current) {
        setFollowing(wasFollowing);
        if (onFollowChange) onFollowChange(wasFollowing, wasFollowing ? 0 : -1);
      }
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      if (mounted.current) setLoading(false);
      setTimeout(() => { if (mounted.current) setAnimating(false); }, 400);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
        following
          ? 'bg-surface-100 text-surface-700 hover:bg-red-50 hover:text-red-500 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-red-500/10 dark:hover:text-red-400'
          : 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md'
      }`}
    >
      {following ? (
        <><UserMinus className={`w-4 h-4 ${animating ? 'social-pop' : ''}`} /> Following</>
      ) : (
        <><UserPlus className={`w-4 h-4 ${animating ? 'social-pop' : ''}`} /> Follow</>
      )}
    </button>
  );
};
