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
import { Users, UserCheck, MapPin, Globe, CalendarDays, Grid3X3, MoreHorizontal, MessageCircle, ChefHat, Instagram, Youtube, Twitter, Facebook, Linkedin, Chrome as TikTokIcon } from 'lucide-react';
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

        if (currentUser && currentUser._id !== userId) {
          socialApi.isFollowing(userId).then(({ data }) => {
            setIsFollowing(data.data?.following || data.following || false);
          }).catch(() => { });
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
      }).catch(() => { });
    }
  }, [tab, userId]);

  useEffect(() => {
    if (tab === 'following') {
      socialApi.getFollowing(userId).then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : (data.data?.following || data.following || []);
        setFollowing(list);
      }).catch(() => { });
    }
  }, [tab, userId]);

  if (loading) return <Loader fullScreen />;
  if (!profile) return <div className="text-center py-20 text-surface-400">Profile not found.</div>;

  const user = profile.userId || profile;
  const { profileImage, bannerImage, bio, specialties, location, website, socialLinks } = profile;
  const hasSocials = socialLinks && (socialLinks.instagram || socialLinks.youtube || socialLinks.twitter || socialLinks.facebook || socialLinks.linkedin || socialLinks.tiktok);

  const handleFollowChange = (nowFollowing, delta, serverCount) => {
    setIsFollowing(nowFollowing);
    if (serverCount !== undefined) {
      setFollowerCount(serverCount);
    } else {
      setFollowerCount((prev) => Math.max(0, prev + delta));
    }
  };

  const handleMessage = async () => {
    if (!currentUser) { navigate('/auth/login'); return; }
    if (currentUser._id === userId) { navigate('/inbox'); return; }
    try {
      const { data } = await chatApi.getOrCreateConversation(userId);
      const conversation = data.data?.conversation;
      if (conversation?._id) navigate(`/inbox/${conversation._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not open chat');
    }
  };

  /* Helper: extract display name from URL */
  const extractHandle = (url) => {
    try {
      const u = new URL(url);
      const path = u.pathname.replace(/\/$/, '');
      const last = path.split('/').filter(Boolean).pop();
      return last ? `${last.replace('@', '')}` : u.hostname.replace('www.', '');
    } catch { return url; }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-0 animate-fade-in">
      {/* Banner */}
      <div className="h-44 sm:h-60 rounded-b-2xl overflow-hidden bg-gradient-to-r from-brand-300 to-brand-500 relative">
        {bannerImage && <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />}
      </div>

      {/* Profile header */}
      <div className="relative card rounded-t-none -mt-1 border border-surface-200 dark:border-surface-800 px-4 sm:px-6 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 -mt-12">
          <div className="flex items-end gap-4 flex-1 min-w-0">
            {profileImage ? (
              <img src={profileImage} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white dark:ring-surface-900 shadow-lg" />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-3xl font-bold ring-4 ring-white dark:ring-surface-900 shadow-lg">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            <div className="min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </h1>
                {user.role === 'chef' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 text-[11px] font-bold uppercase tracking-wider">
                    <ChefHat className="w-3 h-3" /> Chef
                  </span>
                )}
              </div>
              <p className="text-surface-500 text-sm">@{user.username}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              onClick={handleMessage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-700 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
            <FollowButton
              userId={userId}
              initialFollowing={isFollowing}
              onFollowChange={handleFollowChange}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
          <span><b>{stats?.recipes?.published || recipes.length || user.recipeCount || 0}</b> posts</span>
          <span><b>{followerCount}</b> followers</span>
          <span><b>{followingCount}</b> following</span>
        </div>
      </div>

      {/* Profile details card */}
      <div className="mt-4 card p-4 sm:p-5 border border-surface-200 dark:border-surface-800">
        {/* Bio */}
        {bio ? (
          <p className="text-surface-700 dark:text-surface-300 leading-relaxed text-[15px]">{bio}</p>
        ) : (
          <p className="text-surface-400 text-sm italic">No bio added yet.</p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-surface-500 mt-4">
          {specialties && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-semibold">
              <ChefHat className="w-3 h-3" /> {specialties}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-400" />{location}
            </span>
          )}
          {website && (
            <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand-600 hover:underline font-medium">
              <Globe className="w-4 h-4" />
              {(() => { try { return new URL(website).hostname.replace('www.', ''); } catch { return 'Website'; } })()}
            </a>
          )}
          <span className="flex items-center gap-1.5 text-surface-400">
            <CalendarDays className="w-4 h-4" />Joined {formatDate(user.createdAt)}
          </span>
        </div>

        {/* Social Media Links — colored icon buttons with handles */}
        {hasSocials && (
          <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 transition-all group"
              >
                <span className="w-7 h-7 rounded-2xl bg-red-600 flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 group-hover:underline">{extractHandle(socialLinks.instagram)}</span>
              </a>
            )}

            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 transition-all group"
              >
                <span className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">{extractHandle(socialLinks.facebook)}</span>
              </a>
            )}

            {socialLinks.youtube && (
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-red-50 dark:bg-red-900/15 hover:bg-red-100 transition-all group"
              >
                <span className="w-7 h-7 rounded-full bg-[#FF0000] flex items-center justify-center flex-shrink-0">
                  <Youtube className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 group-hover:underline">{extractHandle(socialLinks.youtube)}</span>
              </a>
            )}

            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-sky-50 dark:bg-sky-900/15 hover:bg-sky-100 transition-all group"
              >
                <span className="w-7 h-7 rounded-full bg-[#1DA1F2] flex items-center justify-center flex-shrink-0">
                  <Twitter className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:underline">{extractHandle(socialLinks.twitter)}</span>
              </a>
            )}

            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 transition-all group"
              >
                <span className="w-7 h-7 rounded-full bg-[#0077B5] flex items-center justify-center flex-shrink-0">
                  <Linkedin className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">{extractHandle(socialLinks.linkedin)}</span>
              </a>
            )}

            {socialLinks.tiktok && (
              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 transition-all group"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00f2ea] to-[#ff0050] flex items-center justify-center flex-shrink-0">
                  <TikTokIcon className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 group-hover:underline">{extractHandle(socialLinks.tiktok)}</span>
              </a>
            )}
          </div>
        )}
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
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${tab === id ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
          >
            <span className="flex items-center gap-1.5">
              <Icon className="w-4 h-4" />
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Recipes tab */}
      {tab === 'recipes' && (
        recipes.length === 0 ? (
          <p className="text-center text-surface-400 py-12">No published recipes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
            {recipes.map((r) => <RecipeCard key={r._id} recipe={r} />)}
          </div>
        )
      )}

      {/* Followers tab — detailed cards */}
      {tab === 'followers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
          {followers.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 font-medium">No followers yet</p>
              <p className="text-xs text-surface-400 mt-1">Share recipes to grow your community</p>
            </div>
          ) : (
            followers.map((f) => {
              const u = f.followerId || f;
              const followerImage = getUserProfileImage(u);
              return (
                <Link to={`/profile/${u._id}`} key={f._id} className="card p-4 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all border border-surface-200 dark:border-surface-800 group">
                  {followerImage ? (
                    <img src={followerImage} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {getInitials(u.firstName, u.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-brand-600 transition-colors">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-surface-400 truncate">@{u.username}</p>
                    {u.role === 'chef' && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                        <ChefHat className="w-3 h-3" /> Chef
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                      View
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Following tab — detailed cards */}
      {tab === 'following' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
          {following.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <UserCheck className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 font-medium">Not following anyone yet</p>
              <p className="text-xs text-surface-400 mt-1">Discover chefs and food creators to follow</p>
            </div>
          ) : (
            following.map((f) => {
              const u = f.followingId || f;
              const followingImage = getUserProfileImage(u);
              return (
                <Link to={`/profile/${u._id}`} key={f._id} className="card p-4 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all border border-surface-200 dark:border-surface-800 group">
                  {followingImage ? (
                    <img src={followingImage} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {getInitials(u.firstName, u.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-brand-600 transition-colors">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-surface-400 truncate">@{u.username}</p>
                    {u.role === 'chef' && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                        <ChefHat className="w-3 h-3" /> Chef
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 rounded-full">
                      <UserCheck className="w-3 h-3" /> Following
                    </span>
                  </div>
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
