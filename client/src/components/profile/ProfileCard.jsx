import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Users } from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import { FollowButton } from '../social/SocialButtons';

const ProfileCard = ({ profile }) => {
  const { _id, userId, firstName, lastName, username, bio, profileImage, bannerImage, specialties } = profile;
  const id = userId?._id || _id;
  const fname = userId?.firstName || firstName;
  const lname = userId?.lastName || lastName;
  const uname = userId?.username || username;
  const initialFollowers = profile.followerCount || userId?.followerCount || 0;
  const recipeCount = profile.recipeCount || userId?.recipeCount || 0;
  const initialIsFollowing = profile.isFollowing || false;

  const [followers, setFollowers] = useState(initialFollowers);

  const handleFollowChange = (isNowFollowing, delta, serverCount) => {
    if (serverCount !== undefined) {
      // Use the exact server count when available
      setFollowers(serverCount);
    } else {
      // Optimistic update with delta
      setFollowers((prev) => Math.max(0, prev + delta));
    }
  };

  return (
    <div className="group relative bg-white dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Banner Backdrop */}
      <div className="h-24 w-full relative overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600">
        {bannerImage ? (
          <img src={bannerImage} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
        )}
      </div>

      {/* Avatar & Content */}
      <div className="px-5 pb-6 text-center">
        <div className="relative -mt-12 mb-3 inline-block">
          <Link to={`/profile/${id}`} className="block">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={`${fname} ${lname}`} 
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-surface-900 shadow-lg group-hover:ring-brand-100 dark:group-hover:ring-brand-900/30 transition-all duration-300" 
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-2xl font-bold ring-4 ring-white dark:ring-surface-900 shadow-lg">
                {getInitials(fname, lname)}
              </div>
            )}
          </Link>
          {profile.verified && (
            <span className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white dark:border-surface-900 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </span>
          )}
        </div>

        <div className="mb-4">
          <Link to={`/profile/${id}`} className="block font-display text-lg font-bold text-surface-900 dark:text-white hover:text-brand-600 transition-colors truncate">
            {fname} {lname}
          </Link>
          <p className="text-sm text-surface-500 font-medium tracking-tight">@{uname}</p>
        </div>

        {specialties && (
          <div className="inline-block px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-3">
            {specialties}
          </div>
        )}

        {bio && (
          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 min-h-[2.5rem] mb-5 leading-relaxed">
            {bio}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-surface-100 dark:border-surface-800">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-surface-900 dark:text-white">{recipeCount}</span>
            <span className="text-[14px] lowercase text-surface-600 font-semibold">Recipes</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-surface-900 dark:text-white">{followers}</span>
            <span className="text-[14px] lowercase  text-surface-600 font-semibold">Followers</span>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <FollowButton
            userId={id}
            initialFollowing={initialIsFollowing}
            onFollowChange={handleFollowChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
