import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Loader from '../../components/ui/Loader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#45B34A', '#16a34a', '#15803d', '#4ade80', '#86efac', '#166534'];

const PlatformStats = () => {
  const [stats, setStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recipeStats, setRecipeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getUserStats(), adminApi.getRecipeStats()])
      .then(([s, u, r]) => {
        setStats(s.data.data || s.data);
        setUserStats(u.data.data || u.data);
        setRecipeStats(r.data.data || r.data);
      })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const cuisineData = Object.entries(recipeStats?.byCuisine || {}).map(([name, value]) => ({ name, value }));
  const difficultyData = Object.entries(recipeStats?.byDifficulty || {}).map(([name, value]) => ({ name, value }));
  const userGrowthData = userStats?.growth || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Platform Statistics</h1>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: userStats?.totalUsers },
          { label: 'New This Month', value: userStats?.newThisMonth },
          { label: 'Total Recipes', value: recipeStats?.totalRecipes },
          { label: 'Published', value: recipeStats?.publishedRecipes },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5 text-center">
            <p className="text-2xl font-bold font-display">{value?.toLocaleString() ?? '–'}</p>
            <p className="text-sm text-surface-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Cuisine breakdown */}
        {cuisineData.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Recipes by Cuisine</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={cuisineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {cuisineData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Difficulty breakdown */}
        {difficultyData.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Recipes by Difficulty</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#45B34A" radius={[6, 6, 0, 0]} name="Recipes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* User growth */}
      {userGrowthData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">User Growth</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {cuisineData.length === 0 && difficultyData.length === 0 && userGrowthData.length === 0 && (
        <div className="text-center py-10 text-surface-400">
          <p>No detailed statistics available yet.</p>
        </div>
      )}
    </div>
  );
};

export default PlatformStats;
