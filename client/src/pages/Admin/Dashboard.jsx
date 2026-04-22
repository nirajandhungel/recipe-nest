import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Loader from '../../components/ui/Loader';
import { Link } from 'react-router-dom';
import { Users, UtensilsCrossed, ScrollText, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, to, color = 'bg-brand-50 text-brand-600' }) => (
  <Link to={to} className="card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold font-display mb-1">{value ?? '–'}</p>
    <p className="text-sm text-surface-500 group-hover:text-brand-600 transition-colors">{label}</p>
  </Link>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getUserStats(), adminApi.getRecipeStats()])
      .then(([statsRes, userStatsRes, recipeStatsRes]) => {
        setStats({
          ...(statsRes.data.data || statsRes.data),
          users: userStatsRes.data.data || userStatsRes.data,
          recipes: recipeStatsRes.data.data || recipeStatsRes.data,
        });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats?.users?.totalUsers?.toLocaleString()} to="/admin/users" color="bg-blue-50 text-blue-600" />
        <StatCard icon={UtensilsCrossed} label="Total Recipes" value={stats?.recipes?.totalRecipes?.toLocaleString()} to="/admin/stats" color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Pending Review" value={stats?.recipes?.pendingRecipes ?? stats?.pendingRecipes} to="/admin/recipes/pending" color="bg-brand-50 text-brand-600" />
        <StatCard icon={ScrollText} label="Audit Logs" value={stats?.totalLogs ?? '—'} to="/admin/audit-logs" color="bg-purple-50 text-purple-600" />
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> User Breakdown
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Regular Users', value: stats?.users?.usersByRole?.user, color: 'bg-blue-500' },
              { label: 'Chefs', value: stats?.users?.usersByRole?.chef, color: 'bg-brand-500' },
              { label: 'Admins', value: stats?.users?.usersByRole?.admin, color: 'bg-purple-500' },
              { label: 'Suspended', value: stats?.users?.suspendedUsers, color: 'bg-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-surface-600">{label}</span>
                </div>
                <span className="font-semibold text-sm">{value ?? '–'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-500" /> Recipe Breakdown
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Published', value: stats?.recipes?.publishedRecipes, color: 'bg-emerald-500' },
              { label: 'Drafts', value: stats?.recipes?.draftRecipes, color: 'bg-surface-400' },
              { label: 'Pending Approval', value: stats?.recipes?.pendingRecipes, color: 'bg-brand-400' },
              { label: 'Flagged', value: stats?.recipes?.flaggedRecipes, color: 'bg-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-surface-600">{label}</span>
                </div>
                <span className="font-semibold text-sm">{value ?? '–'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
