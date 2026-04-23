import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/searchApi';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import RecipeCard from '../../components/recipe/RecipeCard';
import ProfileCard from '../../components/profile/ProfileCard';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import { ArrowRight, ChefHat, Clock, Heart, Search, Star, Bookmark, UtensilsCrossed } from 'lucide-react';

// Static featured articles for the "The Latest" sidebar
const LATEST_ARTICLES = [
  {
    category: 'MAIN DISHES',
    time: '1 HOUR AGO',
    title: '20 Quick Weeknight Dinners You Can Make in 30 Minutes',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
  },
  {
    category: 'TASTE TESTS',
    time: '3 HOURS AGO',
    title: 'We Tried 6 Popular Spice Brands—Here\'s Our Favorite',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200',
  },
  {
    category: 'BAKING',
    time: '5 HOURS AGO',
    title: 'The Secret to Perfect Sourdough Bread at Home',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200',
  },
  {
    category: 'GROCERY',
    time: '6 HOURS AGO',
    title: '12 Pantry Staples Every Home Cook Should Have',
    image: 'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&q=80&w=200',
  },
];

// Popular search tags
const POPULAR_SEARCHES = ['Chicken', 'Pasta', 'Banana Bread', 'Momos', 'Pancakes', 'Biryani', 'Cookies', 'Dal Bhat'];

const Home = () => {
  const [trendingRecipes, setTrendingRecipes] = useState([]);
  const [trendingChefs, setTrendingChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interactionState, setInteractionState] = useState({});

  const initInteractionState = (recipes) => {
    const initial = {};
    recipes.forEach((recipe) => {
      initial[recipe._id] = {
        liked: false,
        saved: false,
        likes: recipe.likes || 0,
        saves: recipe.saves || 0,
      };
    });
    return initial;
  };

  const loadInteractionState = async (recipes) => {
    const initial = initInteractionState(recipes);
    if (!user || !recipes.length) {
      setInteractionState(initial);
      return;
    }

    const checks = await Promise.allSettled(
      recipes.map((recipe) =>
        Promise.all([socialApi.isLiked(recipe._id), socialApi.isSaved(recipe._id)])
      )
    );

    checks.forEach((result, idx) => {
      if (result.status !== 'fulfilled') return;
      const recipeId = recipes[idx]._id;
      const [likedRes, savedRes] = result.value;
      initial[recipeId].liked = likedRes?.data?.data?.liked ?? false;
      initial[recipeId].saved = savedRes?.data?.data?.saved ?? false;
    });

    setInteractionState(initial);
  };

  const handleSave = async (recipeId) => {
    if (!user) { toast.error('Log in to save recipes'); navigate('/auth/login'); return; }
    const wasSaved = !!interactionState[recipeId]?.saved;

    setInteractionState((prev) => ({
      ...prev,
      [recipeId]: {
        ...(prev[recipeId] || { likes: 0, saves: 0 }),
        liked: prev[recipeId]?.liked || false,
        saved: !wasSaved,
        likes: prev[recipeId]?.likes || 0,
        saves: wasSaved ? Math.max(0, (prev[recipeId]?.saves || 0) - 1) : (prev[recipeId]?.saves || 0) + 1,
      },
    }));

    try {
      const { data } = wasSaved ? await socialApi.unsave(recipeId) : await socialApi.save(recipeId);
      if (data?.data?.count !== undefined) {
        setInteractionState((prev) => ({
          ...prev,
          [recipeId]: {
            ...(prev[recipeId] || {}),
            saves: data.data.count,
          },
        }));
      }
      toast.success(wasSaved ? 'Recipe removed from saves' : 'Recipe saved!');
    } catch (err) {
      setInteractionState((prev) => ({
        ...prev,
        [recipeId]: {
          ...(prev[recipeId] || {}),
          saved: wasSaved,
          saves: wasSaved ? (prev[recipeId]?.saves || 0) + 1 : Math.max(0, (prev[recipeId]?.saves || 0) - 1),
        },
      }));
      toast.error(err?.response?.data?.message || 'Save failed');
    }
  };

  const handleLike = async (recipeId) => {
    if (!user) { toast.error('Log in to like recipes'); navigate('/auth/login'); return; }
    const wasLiked = !!interactionState[recipeId]?.liked;

    setInteractionState((prev) => ({
      ...prev,
      [recipeId]: {
        ...(prev[recipeId] || { likes: 0, saves: 0 }),
        liked: !wasLiked,
        saved: prev[recipeId]?.saved || false,
        likes: wasLiked ? Math.max(0, (prev[recipeId]?.likes || 0) - 1) : (prev[recipeId]?.likes || 0) + 1,
        saves: prev[recipeId]?.saves || 0,
      },
    }));

    try {
      const { data } = wasLiked ? await socialApi.unlike(recipeId) : await socialApi.like(recipeId);
      if (data?.data?.count !== undefined) {
        setInteractionState((prev) => ({
          ...prev,
          [recipeId]: {
            ...(prev[recipeId] || {}),
            likes: data.data.count,
          },
        }));
      }
      toast.success(wasLiked ? 'Like removed' : 'Recipe liked!');
    } catch (err) {
      setInteractionState((prev) => ({
        ...prev,
        [recipeId]: {
          ...(prev[recipeId] || {}),
          liked: wasLiked,
          likes: wasLiked ? (prev[recipeId]?.likes || 0) + 1 : Math.max(0, (prev[recipeId]?.likes || 0) - 1),
        },
      }));
      toast.error(err?.response?.data?.message || 'Like failed');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [recipesRes, chefsRes] = await Promise.all([
          searchApi.trendingRecipes({ limit: 8 }),
          searchApi.trendingChefs({ limit: 4 }),
        ]);
        const nextRecipes = recipesRes.data.data?.recipes || recipesRes.data.recipes || [];
        setTrendingRecipes(nextRecipes);
        setTrendingChefs(chefsRes.data.data?.chefs || chefsRes.data.chefs || []);
        await loadInteractionState(nextRecipes);
      } catch {
        // fail silently on homepage
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Featured recipe (first one from trending, or fallback)
  const featuredRecipe = trendingRecipes[0] || null;
  const remainingRecipes = trendingRecipes.slice(1);

  return (
    <div className="bg-white dark:bg-surface-950">
      
      {/* ═══════════ HERO: Featured + The Latest sidebar ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: Featured large image */}
          <div className="lg:w-3/5">
            {loading ? (
              <div className="aspect-[4/3] bg-surface-100 rounded-lg animate-pulse"></div>
            ) : featuredRecipe ? (
              <Link to={`/recipes/${featuredRecipe._id}`} className="block group">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-100">
                  {featuredRecipe.imageUrl ? (
                    <img
                      src={featuredRecipe.imageUrl}
                      alt={featuredRecipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-300 bg-surface-100">
                      <UtensilsCrossed className="w-20 h-20" />
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-1">
                    {featuredRecipe.cuisineType || 'MAIN DISHES'}
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-extrabold text-surface-900 dark:text-white leading-snug group-hover:text-brand-600 transition-colors">
                    {featuredRecipe.title}
                  </h2>
                  <p className="text-surface-600 mt-2 text-base leading-relaxed line-clamp-2">
                    {featuredRecipe.description}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="aspect-[4/3] bg-surface-100 rounded-lg flex items-center justify-center">
                <p className="text-surface-400 text-lg">No featured recipe yet</p>
              </div>
            )}
          </div>

          {/* Right: "The Latest" sidebar */}
          <div className="lg:w-2/5">
            <h2 className="font-display text-3xl font-extrabold text-surface-900 dark:text-white mb-6 border-b-2 border-brand-500 pb-3">
              The Latest
            </h2>
            <div className="space-y-5">
              {LATEST_ARTICLES.map((article, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-24 h-24 rounded-md object-cover flex-shrink-0 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1">
                      {article.category} &middot; {article.time}
                    </p>
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white leading-snug group-hover:text-brand-600 transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/recipes" className="inline-block mt-6 text-sm font-bold text-surface-900 border border-surface-300 rounded px-4 py-2 hover:bg-surface-50 transition-colors">
              See More
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ SAVE RECIPES — horizontal scrollable cards ═══════════ */}
      <section className="bg-[#f5f3e7] dark:bg-surface-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-brand-500 fill-brand-500" />
              <span className="font-display text-lg font-bold text-brand-600">myrecipes</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-surface-900 dark:text-white">
              Start Saving These Dishes
            </h2>
            <p className="text-surface-600 text-sm mt-1">Keep your RecipeNest favorites saved for free.</p>
          </div>

          {loading ? (
            <Loader />
          ) : trendingRecipes.length === 0 ? (
            <p className="text-surface-500 text-center py-8">No recipes yet. Be the first to share one!</p>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              {trendingRecipes.map((recipe) => (
                <div key={recipe._id} className="snap-start flex-shrink-0 w-64 bg-white dark:bg-surface-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <Link to={`/recipes/${recipe._id}`} className="block relative">
                    <div className="aspect-[4/3] overflow-hidden">
                      {recipe.imageUrl ? (
                        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-surface-100 flex items-center justify-center text-surface-300">
                          <UtensilsCrossed className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    {/* Category badge */}
                    <span className="absolute bottom-3 left-3 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                      {recipe.cuisineType || recipe.mealType || 'RECIPE'}
                    </span>
                  </Link>
                  <div className="p-4">
                    <Link to={`/recipes/${recipe._id}`}>
                      <h3 className="font-bold text-surface-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-brand-600 transition-colors">
                        {recipe.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-xs text-surface-500">
                      {recipe.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-brand-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.round(recipe.rating) ? 'fill-current' : 'opacity-30'}`} />
                          ))}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}m</span>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); handleSave(recipe._id); }} className={`mt-3 w-full border rounded-full py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      interactionState[recipe._id]?.saved
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-surface-300 text-surface-700 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600'
                    }`}>
                      {interactionState[recipe._id]?.saved ? 'Saved' : 'Save Recipe'}
                      <Bookmark className={`w-4 h-4 ${interactionState[recipe._id]?.saved ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ TRENDING NOW — 2×2 grid ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="font-display text-3xl font-extrabold text-brand-600 mb-8 flex items-center gap-2">
          Trending Now
          <ArrowRight className="w-6 h-6 text-brand-500" />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          {LATEST_ARTICLES.map((article, i) => (
            <div key={i} className="flex gap-4 group cursor-pointer">
              <img
                src={article.image}
                alt={article.title}
                className="w-28 h-20 rounded object-cover flex-shrink-0 group-hover:opacity-90 transition-opacity"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1">
                  {article.category}
                </p>
                <h3 className="text-base font-bold text-surface-900 dark:text-white leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ QUICK DINNERS — 3 column recipe grid ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <h2 className="font-display text-3xl font-extrabold text-center mb-2 text-surface-900 dark:text-white">
          Quick Dinners
          <Link to="/recipes?mealType=Dinner" className="inline-block ml-2 text-brand-500 align-middle">
            <ArrowRight className="w-6 h-6 inline" />
          </Link>
        </h2>
        <p className="text-center text-surface-500 mb-8 text-sm">Easy recipes ready in under an hour</p>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(remainingRecipes.length > 0 ? remainingRecipes.slice(0, 3) : trendingRecipes.slice(0, 3)).map((recipe) => (
              <div key={recipe._id} className="group">
                <Link to={`/recipes/${recipe._id}`} className="block relative">
                  <div className="aspect-square overflow-hidden rounded-lg bg-surface-100">
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-300">
                        <UtensilsCrossed className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  {/* Heart button */}
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(recipe._id); }} className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow transition-colors ${
                    interactionState[recipe._id]?.liked ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-brand-50'
                  }`}>
                    <Heart className={`w-5 h-5 ${interactionState[recipe._id]?.liked ? 'fill-red-500 text-red-500' : 'text-brand-500'}`} />
                  </button>
                </Link>
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-1">
                    {recipe.cuisineType || recipe.mealType}
                  </p>
                  <Link to={`/recipes/${recipe._id}`}>
                    <h3 className="font-bold text-surface-900 dark:text-white text-base leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                      {recipe.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 mt-2 text-brand-500 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(recipe.rating || 0) ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                    <span className="text-surface-500 ml-1">{recipe.ratingCount || 0} Ratings</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════ CELEBRATE THE SEASON — left sidebar + large image ═══════════ */}
      <section className="bg-[#f5f3e7] dark:bg-surface-900 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold text-center mb-10 text-brand-600">
            Celebrate the Season
            <Link to="/recipes" className="inline-block ml-2 text-brand-500 align-middle">
              <ArrowRight className="w-6 h-6 inline" />
            </Link>
          </h2>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left sidebar list */}
            <div className="lg:w-2/5 space-y-4">
              {LATEST_ARTICLES.map((article, i) => (
                <div key={i} className="flex gap-3 group cursor-pointer items-start">
                  <img src={article.image} alt={article.title} className="w-20 h-16 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {i === 2 && (
                      <div className="flex items-center gap-0.5 mt-1 text-brand-500 text-xs">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-3 h-3 fill-current" />
                        ))}
                        <span className="text-surface-500 ml-1">2 Ratings</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: large featured image */}
            <div className="lg:w-3/5">
              {featuredRecipe && (
                <Link to={`/recipes/${featuredRecipe._id}`} className="block group">
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-100">
                    <img
                      src={featuredRecipe.imageUrl || 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=1000'}
                      alt={featuredRecipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-1">
                      {featuredRecipe.cuisineType}
                    </p>
                    <h3 className="font-display text-xl md:text-2xl font-extrabold text-surface-900 dark:text-white group-hover:text-brand-600 transition-colors">
                      {featuredRecipe.title}
                    </h3>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TOP CHEFS ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-2xl font-extrabold text-surface-900 dark:text-white">Top Chefs</h2>
          </div>
          <Link to="/chefs" className="text-sm text-brand-600 hover:underline flex items-center gap-1 font-semibold">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingChefs.map((c) => <ProfileCard key={c._id} profile={c} />)}
          </div>
        )}
      </section>

      {/* ═══════════ SEARCH CTA — "What would you like to cook?" ═══════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-14">
        <div className="border border-surface-200 dark:border-surface-700 rounded-xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🍳</span>
                <h2 className="font-display text-xl font-extrabold text-surface-900 dark:text-white">
                  What would you like to cook?
                </h2>
              </div>
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-surface-300 rounded-l-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                />
                <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-r-md transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
            <div>
              <p className="text-sm font-bold text-surface-900 dark:text-white mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((tag) => (
                  <Link
                    key={tag}
                    to={`/recipes?q=${encodeURIComponent(tag)}`}
                    className="bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-600 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ GREEN BOTTOM BANNER ═══════════ */}
      <section className="bg-brand-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
              Home of the Home Cook
            </h2>
            <p className="text-brand-50 mt-2 text-sm max-w-md">
              RecipeNest is where food lovers, home cooks, and professional chefs come together to share and discover great food.
            </p>
          </div>
          <div>
            <Link to="/auth/register" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-600 font-bold rounded-md hover:bg-surface-50 transition-colors shadow-lg">
              Join as Chef <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
