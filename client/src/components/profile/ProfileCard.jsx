import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Users } from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import { FollowButton } from '../social/SocialButtons';

const ProfileCard = ({ profile }) => {
  const { _id, userId, firstName, lastName, username, bio, profileImage, specialties } = profile;
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
    <div className="card p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <Link to={`/profile/${id}`}>
          {profileImage ? (
            <img src={profileImage} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-semibold">
              {getInitials(fname, lname)}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/profile/${id}`} className="font-display font-semibold hover:text-brand-600 transition-colors">
            {fname} {lname}
          </Link>
          <p className="text-sm text-surface-500">@{uname}</p>
          {bio && <p className="text-sm text-surface-600 mt-1 line-clamp-2">{bio}</p>}
          {specialties && (
            <p className="text-xs text-brand-600 mt-1 font-medium">{specialties}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
            <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {recipeCount} recipes</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {followers} followers</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <FollowButton
          userId={id}
          initialFollowing={initialIsFollowing}
          onFollowChange={handleFollowChange}
        />
      </div>
    </div>
  );
};

export default ProfileCard;
