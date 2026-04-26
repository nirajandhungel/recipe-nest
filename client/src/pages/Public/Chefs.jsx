import { useEffect, useState } from 'react';
import { profileApi } from '../../api/profileApi';
import ProfileCard from '../../components/profile/ProfileCard';
import Loader from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import { Search, ChefHat, SlidersHorizontal } from 'lucide-react';

const Chefs = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await profileApi.getAll({ q: query, page, limit: 12 });
        const list = Array.isArray(data.data) ? data.data : (data.data?.profiles || data.profiles || []);
        setChefs(list);
        setTotalPages(data.meta?.totalPages || data.data?.totalPages || 1);
        setTotal(data.meta?.total || list.length);
      } catch {
        setChefs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query, page]);

  return (
    <div className="bg-white dark:bg-surface-950 min-h-screen">

      {/* Header — consistent with Recipes page */}
      <div className="border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">
            COMMUNITY
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white mb-2">
            Our Chefs
          </h1>
          <p className="text-surface-500 text-sm">
            Discover talented chefs and food creators from around the world
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search chefs…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="w-full border border-surface-300 rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <Loader />
        ) : chefs.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-400 text-lg font-medium">No chefs found</p>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="mt-3 text-brand-600 text-sm font-semibold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-surface-500 mb-6 font-medium">
              {total} chefs found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {chefs.map((c) => <ProfileCard key={c._id} profile={c} />)}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

export default Chefs;
