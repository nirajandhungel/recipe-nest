import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profileApi } from '../../api/profileApi';
import { recipeApi } from '../../api/recipeApi';
import { socialApi } from '../../api/socialApi';
import RecipeCard from '../../components/recipe/RecipeCard';
import { FollowButton } from '../../components/social/SocialButtons';
import Loader from '../../components/ui/Loader';
import { getInitials, formatDate } from '../../utils/helpers';
import { UtensilsCrossed, Users, UserCheck, MapPin, Globe, CalendarDays } from 'lucide-react';

const ProfileView = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('recipes');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, recipesRes, statsRes] = await Promise.all([
          profileApi.getById(userId),
          recipeApi.getByChef(userId),
          profileApi.getStats(userId),
        ]);
        setProfile(profileRes.data.data || profileRes.data.profile || profileRes.data);
        const recData = recipesRes.data;
        setRecipes(Array.isArray(recData.data) ? recData.data : (recData.data?.recipes || recData.recipes || []));
        setStats(statsRes.data.data || statsRes.data.stats || statsRes.data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (tab === 'followers') {
      socialApi.getFollowers(userId).then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : (data.data?.followers || data.followers || []);
        setFollowers(list);
      }).catch(() => {});
    }
  }, [tab, userId]);

  if (loading) return <Loader fullScreen />;
  if (!profile) return <div className="text-center py-20 text-surface-400">Profile not found.</div>;

  const user = profile.userId || profile;
  const { profileImage, bannerImage, bio, specialties, location, website } = profile;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-0 animate-fade-in">
      {/* Banner */}
      <div className="h-48 rounded-b-2xl overflow-hidden bg-gradient-to-r from-brand-400 to-brand-600 mb-0">
        {bannerImage && <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />}
      </div>

      {/* Profile header */}
      <div className="relative px-6 pb-6 card rounded-t-none -mt-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 mb-4">
          {profileImage ? (
            <img src={profileImage} alt="" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-surface-900" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold ring-4 ring-white dark:ring-surface-900">
              {getInitials(user.firstName, user.lastName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold">{user.firstName} {user.lastName}</h1>
            <p className="text-surface-500">@{user.username}</p>
          </div>
          <FollowButton userId={userId} />
        </div>

        {bio && <p className="text-surface-600 dark:text-surface-300 mb-3 max-w-2xl">{bio}</p>}

        <div className="flex flex-wrap gap-4 text-sm text-surface-500">
          {specialties && <span className="text-brand-600 font-medium">{specialties}</span>}
          {location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{location}</span>}
          {website && <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline"><Globe className="w-4 h-4" />Website</a>}
          <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />Joined {formatDate(user.createdAt)}</span>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
          {[
            { icon: UtensilsCrossed, label: 'Recipes', value: stats?.totalRecipes || user.recipeCount || 0 },
            { icon: Users, label: 'Followers', value: user.followerCount || 0 },
            { icon: UserCheck, label: 'Following', value: user.followingCount || 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <p className="font-bold text-lg">{value}</p>
              <p className="text-xs text-surface-500 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 mb-6 border-b border-surface-200 dark:border-surface-800">
        {['recipes', 'followers'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
              tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'recipes' && (
        recipes.length === 0 ? (
          <p className="text-center text-surface-400 py-12">No published recipes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((r) => <RecipeCard key={r._id} recipe={r} />)}
          </div>
        )
      )}

      {tab === 'followers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {followers.map((f) => {
            const u = f.followerId || f;
            return (
              <div key={f._id} className="card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                  {getInitials(u.firstName, u.lastName)}
                </div>
                <div>
                  <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-surface-400">@{u.username}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
