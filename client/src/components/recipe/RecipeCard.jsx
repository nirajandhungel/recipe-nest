import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, Bookmark, Star, UtensilsCrossed } from 'lucide-react';
import { difficultyColor, truncate } from '../../utils/helpers';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    _id, title, description, imageUrl, cuisineType, difficulty,
    prepTimeMinutes, cookTimeMinutes, servings, likes, saves, rating,
    chefId,
  } = recipe;

  const totalTime = (prepTimeMinutes || 0) + (cookTimeMinutes || 0);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes || 0);
  const [saveCount, setSaveCount] = useState(saves || 0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const mounted = useRef(true);

  // Check initial liked/saved state
  useEffect(() => {
    mounted.current = true;
    if (user && _id) {
      Promise.allSettled([
        socialApi.isLiked(_id),
        socialApi.isSaved(_id),
      ]).then(([likeRes, saveRes]) => {
        if (!mounted.current) return;
        if (likeRes.status === 'fulfilled') setLiked(likeRes.value.data?.data?.liked ?? false);
        if (saveRes.status === 'fulfilled') setSaved(saveRes.value.data?.data?.saved ?? false);
      });
    }
    return () => { mounted.current = false; };
  }, [user, _id]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Log in to like recipes'); navigate('/auth/login'); return; }

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
    if (!wasLiked) setLikeAnim(true);

    try {
      if (wasLiked) await socialApi.unlike(_id);
      else await socialApi.like(_id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
    }
    setTimeout(() => setLikeAnim(false), 400);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Log in to save recipes'); navigate('/auth/login'); return; }

    const wasSaved = saved;
    setSaved(!wasSaved);
    setSaveCount((c) => wasSaved ? Math.max(0, c - 1) : c + 1);
    if (!wasSaved) setSaveAnim(true);

    try {
      if (wasSaved) await socialApi.unsave(_id);
      else await socialApi.save(_id);
    } catch {
      setSaved(wasSaved);
      setSaveCount((c) => wasSaved ? c + 1 : Math.max(0, c - 1));
    }
    setTimeout(() => setSaveAnim(false), 400);
  };

  return (
    <Link to={`/recipes/${_id}`} className="group block">
      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-surface-100 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-300">
            <UtensilsCrossed className="w-16 h-16" />
          </div>
        )}

        {/* Like button (top-right) */}
        <button
          onClick={handleLike}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
            liked
              ? 'bg-red-50 hover:bg-red-100'
              : 'bg-white/90 hover:bg-white'
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-all duration-200 ${
              liked ? 'fill-red-500 text-red-500' : 'text-surface-600'
            } ${likeAnim ? 'social-heart-burst' : ''}`}
          />
        </button>

        {/* Save button (top-left) */}
        <button
          onClick={handleSave}
          className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
            saved
              ? 'bg-brand-50 hover:bg-brand-100'
              : 'bg-white/90 hover:bg-white'
          }`}
        >
          <Bookmark
            className={`w-5 h-5 transition-all duration-200 ${
              saved ? 'fill-brand-500 text-brand-500' : 'text-surface-600'
            } ${saveAnim ? 'social-pop' : ''}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1">
          {cuisineType}
        </p>

        <h3 className="font-bold text-surface-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
          {title}
        </h3>

        {/* Star rating */}
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 text-brand-500 ${i < Math.round(rating || 0) ? 'fill-current' : 'opacity-30'}`}
            />
          ))}
          {likeCount > 0 && (
            <span className="text-xs text-surface-500 ml-1">{likeCount}</span>
          )}
        </div>

        {/* Time + social */}
        <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {totalTime >= 60 ? `${Math.floor(totalTime / 60)} hr ${totalTime % 60} min` : `${totalTime} min`}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Heart className={`w-3 h-3 ${liked ? 'fill-red-500 text-red-500' : ''}`} /> {likeCount}
          </span>
          <span className="flex items-center gap-0.5">
            <Bookmark className={`w-3 h-3 ${saved ? 'fill-brand-500 text-brand-500' : ''}`} /> {saveCount}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
