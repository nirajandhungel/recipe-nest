import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchApi } from '../../api/searchApi';
import RecipeCard from '../../components/recipe/RecipeCard';
import ProfileCard from '../../components/profile/ProfileCard';
import Loader from '../../components/ui/Loader';
import { Search, Flame, ChefHat } from 'lucide-react';

const POPULAR_SEARCHES = ['Chicken', 'Pasta', 'Momos', 'Biryani', 'Pancakes', 'Dal Bhat', 'Cookies'];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'recipes';

  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(query);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const fn = type === 'chefs' ? searchApi.trendingChefs : searchApi.trendingRecipes;
        const { data } = await fn({ limit: 8 });
        setTrending(data.data?.recipes || data.data?.chefs || data.recipes || data.chefs || []);
      } catch {}
    };
    loadTrending();
  }, [type]);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const search = async () => {
      setLoading(true);
      try {
        const fn = type === 'chefs' ? searchApi.chefs : searchApi.recipes;
        const { data } = await fn({ q: query, limit: 20 });
        setResults(data.data?.results || data.data?.recipes || data.data?.chefs || data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [query, type]);

  const handleSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    if (input) p.set('q', input); else p.delete('q');
    setSearchParams(p);
  };

  const switchType = (t) => {
    const p = new URLSearchParams(searchParams);
    p.set('type', t);
    setSearchParams(p);
  };

  const displayList = query ? results : trending;

  return (
    <div className="bg-white dark:bg-surface-950 min-h-screen">
      {/* Header */}
      <div className="border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">SEARCH</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white mb-4">
            What are you looking for?
          </h1>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-0 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search recipes or chefs…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full border border-surface-300 rounded-l-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-r-md transition-colors font-medium text-sm">
              Search
            </button>
          </form>

          {/* Popular searches */}
          {!query && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-surface-500">Popular:</span>
              {POPULAR_SEARCHES.map((tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}&type=${type}`}
                  className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full hover:bg-brand-600 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Type tabs */}
        <div className="flex gap-1 mb-8 border-b border-surface-200 dark:border-surface-800">
          {['recipes', 'chefs'].map((t) => (
            <button
              key={t}
              onClick={() => switchType(t)}
              className={`px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all capitalize border-b-2 ${
                type === t
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Section heading */}
        {!query && (
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-4 h-4 text-brand-500" />
            <h2 className="font-display text-xl font-extrabold text-surface-900 dark:text-white capitalize">
              Trending {type}
            </h2>
          </div>
        )}

        {loading ? (
          <Loader />
        ) : displayList.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-400 text-lg font-medium">
              {query ? `No ${type} found for "${query}"` : `No trending ${type} yet.`}
            </p>
          </div>
        ) : type === 'recipes' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayList.map((r) => <RecipeCard key={r._id} recipe={r} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayList.map((c) => <ProfileCard key={c._id} profile={c} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
