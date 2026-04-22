import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useRecipes } from '../../hooks/useRecipes';
import RecipeCard from '../../components/recipe/RecipeCard';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';
import { CUISINE_TYPES, DIFFICULTY_LEVELS, MEAL_TYPES } from '../../constants/roles';
import { Search, SlidersHorizontal, X, ChefHat } from 'lucide-react';

const Recipes = () => {
  const { recipes, loading, pagination, fetchRecipes } = useRecipes();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const cuisine = searchParams.get('cuisine') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const mealType = searchParams.get('mealType') || '';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    fetchRecipes({ q: query, cuisine, difficulty, mealType, page, limit: 12 });
  }, [query, cuisine, difficulty, mealType, page]);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const clearFilters = () => setSearchParams({});
  const hasFilters = query || cuisine || difficulty || mealType;

  const FilterSelect = ({ label, param, options }) => (
    <select
      value={searchParams.get(param) || ''}
      onChange={(e) => updateParam(param, e.target.value)}
      className="border border-surface-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-500 bg-white"
    >
      <option value="">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  // Determine page title
  const pageTitle = mealType || cuisine || 'All Recipes';
  const pageDesc = query ? `Search results for "${query}"` : 'Explore our collection of chef-crafted recipes';

  return (
    <div className="bg-white dark:bg-surface-950 min-h-screen">
      {/* Page header */}
      <div className="border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">RECIPES</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white mb-2">{pageTitle}</h1>
          <p className="text-surface-500 text-sm">{pageDesc}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search + filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search recipes…"
              value={query}
              onChange={(e) => updateParam('q', e.target.value)}
              className="w-full border border-surface-300 rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 border border-surface-300 ${showFilters ? 'bg-brand-50 text-brand-600 border-brand-500' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-brand-500 rounded-full" />}
          </button>
        </div>

        {showFilters && (
          <div className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterSelect label="All Cuisines" param="cuisine" options={CUISINE_TYPES} />
            <FilterSelect label="Any Difficulty" param="difficulty" options={DIFFICULTY_LEVELS} />
            <FilterSelect label="Any Meal Type" param="mealType" options={MEAL_TYPES} />
            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost text-sm gap-1 justify-center border border-surface-300 rounded-md">
                <X className="w-4 h-4" /> Clear All
              </button>
            )}
          </div>
        )}

        {loading ? (
          <Loader />
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-400 text-lg font-medium">No recipes found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-brand-600 text-sm font-semibold hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-surface-500 mb-6 font-medium">{pagination.total} recipes found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map((r) => <RecipeCard key={r._id} recipe={r} />)}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => updateParam('page', p)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Recipes;
