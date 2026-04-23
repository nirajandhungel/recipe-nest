import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../api/analyticsApi';
import Loader from '../../components/ui/Loader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { BarChart2, Eye, Heart, Bookmark, MessageCircle, TrendingUp, Users, UserCheck, Award, Clock } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const StatCard = ({ icon: Icon, label, value, color = 'text-brand-500', bgColor = 'bg-brand-50' }) => (
  <div className="card p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-surface-500">{label}</span>
      <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </div>
    <p className="text-2xl font-bold font-display">{value ?? 0}</p>
  </div>
);

const ActivityItem = ({ icon: Icon, color, user, action, target, date }) => (
  <div className="flex items-start gap-3 py-3 border-b border-surface-100 dark:border-surface-800 last:border-0">
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
      <Icon className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm">
        {user?._id ? (
          <Link to={`/profile/${user._id}`} className="font-semibold hover:text-brand-600">
            {user?.firstName} {user?.lastName}
          </Link>
        ) : (
          <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
        )}
        <span className="text-surface-500"> {action} </span>
        <span className="font-medium text-brand-600">{target}</span>
      </p>
      <p className="text-xs text-surface-400 mt-0.5">{formatDate(date)}</p>
    </div>
  </div>
);

const COLORS = ['#45B34A', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

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

  const totalViews = recipeData?.totalViews || engagementData?.totalViews || 0;
  const totalLikes = recipeData?.totalLikes || engagementData?.totalLikes || 0;
  const totalSaves = recipeData?.totalSaves || engagementData?.totalSaves || 0;
  const totalComments = recipeData?.totalComments || engagementData?.totalComments || 0;

  const recipeChartData = recipeData?.recipes?.map((r) => ({
    name: r.title?.slice(0, 16) + (r.title?.length > 16 ? '…' : ''),
    views: r.views || 0,
    likes: r.likes || 0,
    saves: r.saves || 0,
  })) || [];

  const engagementChartData = engagementData?.timeline || [];

  const topRecipes = engagementData?.topRecipes || recipeData?.recipes?.slice(0, 5) || [];

  const pieData = [
    { name: 'Likes', value: totalLikes },
    { name: 'Saves', value: totalSaves },
    { name: 'Comments', value: totalComments },
  ].filter((d) => d.value > 0);

  // Merge all recent activity into one feed sorted by date
  const activityFeed = [
    ...(engagementData?.recentLikes || []).map((l) => ({
      icon: Heart, color: 'bg-red-500', user: l.user, action: 'liked', target: l.recipe?.title, date: l.date,
    })),
    ...(engagementData?.recentSaves || []).map((s) => ({
      icon: Bookmark, color: 'bg-blue-500', user: s.user, action: 'saved', target: s.recipe?.title, date: s.date,
    })),
    ...(engagementData?.recentComments || []).map((c) => ({
      icon: MessageCircle, color: 'bg-emerald-500', user: c.user, action: 'commented on', target: c.recipe?.title, date: c.date, text: c.text,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

  const hasData = totalViews > 0 || totalLikes > 0 || totalSaves > 0 || totalComments > 0 || recipeChartData.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Total Views" value={totalViews.toLocaleString()} color="text-indigo-500" bgColor="bg-indigo-50" />
        <StatCard icon={Heart} label="Total Likes" value={totalLikes.toLocaleString()} color="text-red-500" bgColor="bg-red-50" />
        <StatCard icon={Bookmark} label="Total Saves" value={totalSaves.toLocaleString()} color="text-blue-500" bgColor="bg-blue-50" />
        <StatCard icon={MessageCircle} label="Comments" value={totalComments.toLocaleString()} color="text-emerald-500" bgColor="bg-emerald-50" />
      </div>

      {/* ═══ Social Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Followers" value={(engagementData?.followerCount || 0).toLocaleString()} />
        <StatCard icon={UserCheck} label="Following" value={(engagementData?.followingCount || 0).toLocaleString()} color="text-violet-500" bgColor="bg-violet-50" />
        <StatCard icon={Award} label="Published Recipes" value={recipeData?.published || 0} color="text-amber-500" bgColor="bg-amber-50" />
        <StatCard icon={Clock} label="Draft Recipes" value={recipeData?.draft || 0} color="text-surface-500" bgColor="bg-surface-100" />
      </div>

      {!hasData ? (
        <div className="text-center py-16 text-surface-400">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No analytics data yet. Start publishing recipes!</p>
        </div>
      ) : (
        <>
          {/* ═══ Charts Row ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recipe Performance */}
            {recipeChartData.length > 0 && (
              <div className="card p-5 lg:col-span-2">
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
                    <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} name="Views" />
                    <Bar dataKey="likes" fill="#ef4444" radius={[4, 4, 0, 0]} name="Likes" />
                    <Bar dataKey="saves" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Saves" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Engagement Breakdown Pie */}
            {pieData.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Engagement Breakdown</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ═══ Engagement Over Time ═══ */}
          {engagementChartData.length > 0 && (
            <div className="card p-5 mb-8">
              <h2 className="font-semibold mb-4">Engagement — Last 7 Days</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={engagementChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Views" />
                  <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Likes" />
                  <Line type="monotone" dataKey="saves" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Saves" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ═══ Bottom Row: Activity Feed + Top Recipes ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Feed */}
            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" /> Recent Activity
              </h2>
              {activityFeed.length === 0 ? (
                <p className="text-surface-400 text-sm py-4 text-center">No recent activity</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {activityFeed.map((item, i) => (
                    <ActivityItem key={i} {...item} />
                  ))}
                </div>
              )}
            </div>

            {/* Top Recipes */}
            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Top Recipes
              </h2>
              {topRecipes.length === 0 ? (
                <p className="text-surface-400 text-sm py-4 text-center">No published recipes yet</p>
              ) : (
                <div className="space-y-3">
                  {topRecipes.map((r, i) => (
                    <div key={r._id} className="flex items-center gap-3 py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                      <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.title}</p>
                        <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
                          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-400" />{r.likes || 0}</span>
                          <span className="flex items-center gap-0.5"><Bookmark className="w-3 h-3 text-blue-400" />{r.saves || 0}</span>
                          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3 text-indigo-400" />{r.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChefAnalytics;
