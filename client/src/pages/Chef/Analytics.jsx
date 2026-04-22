import { useEffect, useState } from 'react';
import { analyticsApi } from '../../api/analyticsApi';
import Loader from '../../components/ui/Loader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { BarChart2, Eye, Heart, Bookmark, MessageCircle, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'text-brand-500' }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-surface-500">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <p className="text-2xl font-bold font-display">{value ?? '–'}</p>
  </div>
);

const ChefAnalytics = () => {
  const [recipeData, setRecipeData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.chefRecipes(),
      analyticsApi.chefEngagement(),
    ])
      .then(([recipeRes, engageRes]) => {
        setRecipeData(recipeRes.data.data || recipeRes.data);
        setEngagementData(engageRes.data.data || engageRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const recipeChartData = recipeData?.recipes?.map((r) => ({
    name: r.title?.slice(0, 16) + (r.title?.length > 16 ? '…' : ''),
    views: r.views || 0,
    likes: r.likes || 0,
    saves: r.saves || 0,
  })) || [];

  const engagementChartData = engagementData?.timeline || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Total Views" value={recipeData?.totalViews?.toLocaleString()} />
        <StatCard icon={Heart} label="Total Likes" value={engagementData?.totalLikes?.toLocaleString()} color="text-red-500" />
        <StatCard icon={Bookmark} label="Total Saves" value={engagementData?.totalSaves?.toLocaleString()} color="text-blue-500" />
        <StatCard icon={MessageCircle} label="Comments" value={engagementData?.totalComments?.toLocaleString()} color="text-emerald-500" />
      </div>

      {/* Recipe performance chart */}
      {recipeChartData.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" /> Recipe Performance
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={recipeChartData} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#45B34A" radius={[4, 4, 0, 0]} name="Views" />
              <Bar dataKey="likes" fill="#ef4444" radius={[4, 4, 0, 0]} name="Likes" />
              <Bar dataKey="saves" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Saves" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Engagement over time */}
      {engagementChartData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Engagement Over Time</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={engagementChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="#45B34A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {recipeChartData.length === 0 && engagementChartData.length === 0 && (
        <div className="text-center py-16 text-surface-400">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No analytics data yet. Start publishing recipes!</p>
        </div>
      )}
    </div>
  );
};

export default ChefAnalytics;
