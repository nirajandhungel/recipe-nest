import { useEffect, useState } from 'react';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getUserProfileImage } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import { Link } from 'react-router-dom';
import { Users, UserCheck, ChefHat, MessageCircle } from 'lucide-react';

const UserCard = ({ user: u, type }) => {
  const avatar = getUserProfileImage(u);

  return (
    <Link
      to={`/profile/${u._id}`}
      className="card p-4 flex items-center gap-4 border border-surface-200 dark:border-surface-800 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
    >
      {/* Avatar */}
      {avatar ? (
        <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800 flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
          {getInitials(u.firstName, u.lastName)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] truncate group-hover:text-brand-600 transition-colors">
          {u.firstName} {u.lastName}
        </p>
        <p className="text-xs text-surface-400 truncate mt-0.5">@{u.username}</p>
        {u.role === 'chef' && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <ChefHat className="w-3 h-3" /> Chef
          </span>
        )}
      </div>

      {/* Action hint */}
      <div className="flex-shrink-0">
        {type === 'following' ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-full">
            <UserCheck className="w-3 h-3" /> Following
          </span>
        ) : (
          <span className="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-full group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
            View Profile
          </span>
        )}
      </div>
    </Link>
  );
};

export const Followers = () => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialApi.getFollowers(user._id)
      .then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : (data.data?.followers || data.followers || []);
        setFollowers(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user._id]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
            <Users className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Followers</h1>
            <p className="text-sm text-surface-400">People who follow you</p>
          </div>
        </div>
        <span className="text-sm font-bold text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-full">
          {followers.length}
        </span>
      </div>

      {loading ? (
        <Loader />
      ) : followers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-9 h-9 text-surface-300" />
          </div>
          <p className="text-surface-500 font-medium text-lg">No followers yet</p>
          <p className="text-sm text-surface-400 mt-1 max-w-sm mx-auto">
            Share your recipes and engage with the community to grow your followers
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {followers.map((item) => {
            const u = (item.followerId?.username ? item.followerId : item.followingId) || item;
            return <UserCard key={item._id || u._id} user={u} type="follower" />;
          })}
        </div>
      )}
    </div>
  );
};

export const Following = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialApi.getFollowing(user._id)
      .then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : (data.data?.following || data.following || []);
        setFollowing(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user._id]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
            <UserCheck className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Following</h1>
            <p className="text-sm text-surface-400">People you follow</p>
          </div>
        </div>
        <span className="text-sm font-bold text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-full">
          {following.length}
        </span>
      </div>

      {loading ? (
        <Loader />
      ) : following.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-9 h-9 text-surface-300" />
          </div>
          <p className="text-surface-500 font-medium text-lg">Not following anyone yet</p>
          <p className="text-sm text-surface-400 mt-1 max-w-sm mx-auto">
            Discover amazing chefs and food creators to follow
          </p>
          <Link
            to="/chefs"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            Browse Chefs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {following.map((item) => {
            const u = (item.followingId?.username ? item.followingId : item.followerId) || item;
            return <UserCard key={item._id || u._id} user={u} type="following" />;
          })}
        </div>
      )}
    </div>
  );
};

export default Followers;
