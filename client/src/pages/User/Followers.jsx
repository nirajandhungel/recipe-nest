import { useEffect, useState } from 'react';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getUserProfileImage } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const UserList = ({ users, emptyMsg }) => {
  if (!users.length) return <p className="text-center text-surface-400 py-10">{emptyMsg}</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {users.map((item) => {
        // If it's a follow doc, it has followerId or followingId
        // If it's your FOLLOWING list, you want the 'followingId'
        // If it's your FOLLOWERS list, you want the 'followerId'
        // If both are present, we need to know which one to pick. 
        // But in this app, we can detect if it's the populated object.
        const u = (item.followerId?.username ? item.followerId : item.followingId) || item;
        const avatar = getUserProfileImage(u);
        return (
          <Link key={item._id || u._id} to={`/profile/${u._id}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-all">
            {avatar ? (
              <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {getInitials(u.firstName, u.lastName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-surface-400 truncate">@{u.username}</p>
            </div>
          </Link>
        );
      })}
    </div>
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
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Followers</h1>
        <span className="badge bg-surface-100 text-surface-600">{followers.length}</span>
      </div>
      {loading ? <Loader /> : <UserList users={followers} emptyMsg="You have no followers yet." />}
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
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Following</h1>
        <span className="badge bg-surface-100 text-surface-600">{following.length}</span>
      </div>
      {loading ? <Loader /> : <UserList users={following} emptyMsg="You're not following anyone yet." />}
    </div>
  );
};

export default Followers;
