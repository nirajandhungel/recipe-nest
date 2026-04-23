import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { profileApi } from '../../api/profileApi';
import { recipeApi } from '../../api/recipeApi';
import { socialApi } from '../../api/socialApi';
import { chatApi } from '../../api/chatApi';
import RecipeCard from '../../components/recipe/RecipeCard';
import { FollowButton } from '../../components/social/SocialButtons';
import Loader from '../../components/ui/Loader';
import { getInitials, formatDate, getUserProfileImage } from '../../utils/helpers';
import { Users, UserCheck, MapPin, Globe, CalendarDays, Grid3X3, MoreHorizontal, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('recipes');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

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
        const nextStats = statsRes.data.data || statsRes.data.stats || statsRes.data;
        setStats(nextStats);
        const nextProfile = profileRes.data.data || profileRes.data.profile || profileRes.data;
        const nextUser = nextProfile.userId || nextProfile;
        setFollowerCount(nextProfile.followerCount || nextUser.followerCount || nextStats?.social?.followers || 0);
        setFollowingCount(nextProfile.followingCount || nextUser.followingCount || nextStats?.social?.following || 0);

        // Check follow status
        if (currentUser && currentUser._id !== userId) {
          socialApi.isFollowing(userId).then(({ data }) => {
            setIsFollowing(data.data?.following || data.following || false);
          }).catch(() => {});
        }
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

  useEffect(() => {
    if (tab === 'following') {
      socialApi.getFollowing(userId).then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : (data.data?.following || data.following || []);
        setFollowing(list);
      }).catch(() => {});
    }
  }, [tab, userId]);

  if (loading) return <Loader fullScreen />;
  if (!profile) return <div className="text-center py-20 text-surface-400">Profile not found.</div>;

  const user = profile.userId || profile;
  const { profileImage, bannerImage, bio, specialties, location, website } = profile;

  const handleFollowChange = (nowFollowing, delta, serverCount) => {
    setIsFollowing(nowFollowing);
    if (serverCount !== undefined) {
      setFollowerCount(serverCount);
    } else {
      setFollowerCount((prev) => Math.max(0, prev + delta));
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      navigate('/auth/login');
      return;
    }
    if (currentUser._id === userId) {
      navigate('/inbox');
      return;
    }
    try {
      const { data } = await chatApi.getOrCreateConversation(userId);
      const conversation = data.data?.conversation;
      if (conversation?._id) {
        navigate(`/inbox/${conversation._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not open chat');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-0 animate-fade-in">
      {/* Banner */}
      <div className="h-44 sm:h-60 rounded-b-2xl overflow-hidden bg-gradient-to-r from-brand-300 to-brand-500">
        {bannerImage && <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />}
      </div>

      {/* Profile header */}
      <div className="relative card rounded-t-none -mt-1 border border-surface-200 dark:border-surface-800 px-4 sm:px-6 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 -mt-12">
          <div className="flex items-end gap-4 flex-1 min-w-0">
            {profileImage ? (
              <img src={profileImage} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white dark:ring-surface-900" />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-3xl font-bold ring-4 ring-white dark:ring-surface-900">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            <div className="min-w-0 pb-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-surface-500 text-sm">@{user.username}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              onClick={handleMessage}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
            <FollowButton 
              userId={userId} 
              initialFollowing={isFollowing} 
              onFollowChange={handleFollowChange} 
            />
            <button className="p-2 rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
          <span><b>{stats?.recipes?.published || recipes.length || user.recipeCount || 0}</b> posts</span>
          <span><b>{followerCount}</b> followers</span>
          <span><b>{followingCount}</b> following</span>
        </div>
      </div>

      {/* Profile details */}
      <div className="mt-4 card p-4 sm:p-5 border border-surface-200 dark:border-surface-800">
        {bio ? (
          <p className="text-surface-700 dark:text-surface-300 leading-relaxed">{bio}</p>
        ) : (
          <p className="text-surface-400 text-sm">No bio added yet.</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-surface-500 mt-4">
          {specialties && <span className="text-brand-600 font-medium">{specialties}</span>}
          {location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{location}</span>}
          {website && <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline"><Globe className="w-4 h-4" />Website</a>}
          <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />Joined {formatDate(user.createdAt)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 mb-5 border-b border-surface-200 dark:border-surface-800 justify-center">
        {[
          { id: 'recipes', label: 'Posts', icon: Grid3X3 },
          { id: 'followers', label: 'Followers', icon: Users },
          { id: 'following', label: 'Following', icon: UserCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
              tab === id ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Icon className="w-4 h-4" />
              {label}
            </span>
          </button>
        ))}
      </div>

      {tab === 'recipes' && (
        recipes.length === 0 ? (
          <p className="text-center text-surface-400 py-12">No published recipes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
            {recipes.map((r) => <RecipeCard key={r._id} recipe={r} />)}
          </div>
        )
      )}

      {tab === 'followers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-10">
          {followers.length === 0 ? (
            <p className="text-center text-surface-400 py-12 col-span-full">No followers yet.</p>
          ) : (
            followers.map((f) => {
              const u = f.followerId || f;
              const followerImage = getUserProfileImage(u);
              return (
                <Link to={`/profile/${u._id}`} key={f._id} className="card p-3 flex items-center gap-3 hover:shadow-md transition-all">
                  {followerImage ? (
                    <img src={followerImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                      {getInitials(u.firstName, u.lastName)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-surface-400">@{u.username}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {tab === 'following' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-10">
          {following.length === 0 ? (
            <p className="text-center text-surface-400 py-12 col-span-full">Not following anyone yet.</p>
          ) : (
            following.map((f) => {
              const u = f.followingId || f;
              const followingImage = getUserProfileImage(u);
              return (
                <Link to={`/profile/${u._id}`} key={f._id} className="card p-3 flex items-center gap-3 hover:shadow-md transition-all">
                  {followingImage ? (
                    <img src={followingImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                      {getInitials(u.firstName, u.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-surface-400 truncate">@{u.username}</p>
                  </div>
                  <UserCheck className="w-4 h-4 text-surface-300" />
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
