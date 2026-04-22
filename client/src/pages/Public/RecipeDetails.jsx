import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRecipes } from '../../hooks/useRecipes';
import { LikeButton, SaveButton } from '../../components/social/SocialButtons';
import CommentSection from '../../components/social/CommentSection';
import Loader from '../../components/ui/Loader';
import { difficultyColor, formatDate, getInitials } from '../../utils/helpers';
import { Clock, Users, ChefHat, Tag, Star, Printer, Share2, UtensilsCrossed } from 'lucide-react';

const RecipeDetails = () => {
  const { id } = useParams();
  const { recipe, loading, fetchRecipe } = useRecipes();

  useEffect(() => {
    fetchRecipe(id);
  }, [id]);

  if (loading) return <Loader fullScreen />;
  if (!recipe) return <div className="text-center py-20 text-surface-400">Recipe not found.</div>;

  const {
    title, description, imageUrl, cuisineType, difficulty, mealType,
    prepTimeMinutes, cookTimeMinutes, servings, tags, ingredients,
    steps, likes, saves, rating, createdAt, chefId,
  } = recipe;

  const totalTime = (prepTimeMinutes || 0) + (cookTimeMinutes || 0);

  return (
    <div className="bg-white dark:bg-surface-950 min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/recipes" className="hover:text-brand-500 transition-colors">Recipes</Link>
            <span>/</span>
            <span className="text-surface-700 dark:text-surface-300 font-medium">{cuisineType}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        {/* Category label */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">
          {cuisineType} &middot; {mealType}
        </p>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white mb-4 leading-tight">
          {title}
        </h1>

        {/* Description */}
        <p className="text-surface-600 dark:text-surface-400 text-lg leading-relaxed mb-6">{description}</p>

        {/* Chef info */}
        {chefId && (
          <Link to={`/profile/${chefId._id}`} className="flex items-center gap-3 mb-6 group w-fit">
            {chefId.profileImage ? (
              <img src={chefId.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                {getInitials(chefId.firstName, chefId.lastName)}
              </div>
            )}
            <div>
              <p className="text-sm font-bold group-hover:text-brand-600 transition-colors">
                By {chefId.firstName} {chefId.lastName}
              </p>
              <p className="text-xs text-surface-400">Published {formatDate(createdAt)}</p>
            </div>
          </Link>
        )}

        {/* Star rating + actions bar */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-y border-surface-200 dark:border-surface-800 mb-6">
          <div className="flex items-center gap-1 text-brand-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(rating || 0) ? 'fill-current' : 'opacity-30'}`} />
            ))}
            <span className="text-sm text-surface-500 ml-1">{likes || 0} Ratings</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <LikeButton recipeId={id} initialCount={likes} />
            <SaveButton recipeId={id} initialCount={saves} />
          </div>
        </div>

        {/* Hero image */}
        {imageUrl && (
          <div className="rounded-lg overflow-hidden aspect-[16/9] mb-8">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Recipe meta boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center py-4 border border-surface-200 dark:border-surface-700 rounded-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">Prep Time</p>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{prepTimeMinutes} min</p>
          </div>
          <div className="text-center py-4 border border-surface-200 dark:border-surface-700 rounded-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">Cook Time</p>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{cookTimeMinutes} min</p>
          </div>
          <div className="text-center py-4 border border-surface-200 dark:border-surface-700 rounded-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">Total Time</p>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{totalTime} min</p>
          </div>
          <div className="text-center py-4 border border-surface-200 dark:border-surface-700 rounded-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">Servings</p>
            <p className="text-lg font-bold text-surface-900 dark:text-white">{servings}</p>
          </div>
        </div>

        {/* Difficulty + Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className={`badge text-xs ${difficultyColor(difficulty)}`}>{difficulty}</span>
          {tags?.map((t) => (
            <span key={t} className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
              <Tag className="w-3 h-3" /> {t}
            </span>
          ))}
        </div>

        {/* Ingredients + Steps layout */}
        <div className="grid md:grid-cols-5 gap-8 mb-10">
          {/* Ingredients */}
          <div className="md:col-span-2">
            <h2 className="font-display text-xl font-extrabold mb-4 text-surface-900 dark:text-white border-b-2 border-brand-500 pb-2">
              Ingredients
            </h2>
            <div className="space-y-0">
              {ingredients?.map((ing, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800 last:border-0">
                  <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{ing.name}</span>
                  <span className="text-sm text-surface-500 font-medium">{ing.quantity} {ing.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="md:col-span-3">
            <h2 className="font-display text-xl font-extrabold mb-4 text-surface-900 dark:text-white border-b-2 border-brand-500 pb-2">
              Directions
            </h2>
            <div className="space-y-6">
              {steps?.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {step.stepNumber || i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-surface-900 dark:text-white text-sm mb-1">Step {step.stepNumber || i + 1}</h3>
                    <p className="text-surface-700 dark:text-surface-300 leading-relaxed text-sm">{step.instruction}</p>
                    {step.imageUrl && (
                      <img src={step.imageUrl} alt={`Step ${i + 1}`} className="mt-3 rounded-lg w-full max-h-48 object-cover" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="border-t border-surface-200 dark:border-surface-800 pt-8">
          <CommentSection recipeId={id} />
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
