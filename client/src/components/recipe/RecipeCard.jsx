import { Link } from 'react-router-dom';
import { Clock, Users, Heart, Bookmark, Star, UtensilsCrossed } from 'lucide-react';
import { difficultyColor, truncate } from '../../utils/helpers';

const RecipeCard = ({ recipe }) => {
  const {
    _id, title, description, imageUrl, cuisineType, difficulty,
    prepTimeMinutes, cookTimeMinutes, servings, likes, saves, rating,
    chefId,
  } = recipe;

  const totalTime = (prepTimeMinutes || 0) + (cookTimeMinutes || 0);

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
        {/* Heart button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-brand-50 transition-colors"
        >
          <Heart className="w-5 h-5 text-brand-500" />
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
          {likes > 0 && (
            <span className="text-xs text-surface-500 ml-1">{likes} Ratings</span>
          )}
        </div>

        {/* Time + servings */}
        <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {totalTime >= 60 ? `${Math.floor(totalTime / 60)} hr ${totalTime % 60} min` : `${totalTime} min`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
