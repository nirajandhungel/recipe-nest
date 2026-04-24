import { useEffect, useState } from 'react';
import { profileApi } from '../../api/profileApi';
import ProfileCard from '../../components/profile/ProfileCard';
import Loader from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import { Search, ChefHat } from 'lucide-react';

const Chefs = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await profileApi.getAll({ q: query, page, limit: 12 });
        const list = Array.isArray(data.data) ? data.data : (data.data?.profiles || data.profiles || []);
        setChefs(list);
        setTotalPages(data.meta?.totalPages || data.data?.totalPages || 1);
      } catch {
        setChefs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query, page]);

  return (
    <div className="bg-[#fcfaf2] dark:bg-surface-950 min-h-screen pb-20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-brand-600 py-16 md:py-24 mb-10">
        {/* Abstract shapes or pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Meet Our <span className="text-brand-200">Talented Chefs</span>
          </h1>
          <p className="text-brand-50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Discover the creative minds behind your favorite recipes. From home cooks to professionals, 
            our community is built on a shared passion for exceptional food.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search chefs…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="w-full border border-surface-300 rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {loading ? (
          <Loader />
        ) : chefs.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-400 text-lg font-medium">No chefs found.</p>
          </div>
        ) : (
          <>
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
