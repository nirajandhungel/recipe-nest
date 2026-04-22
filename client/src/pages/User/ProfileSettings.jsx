import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { profileSchema } from '../../utils/validators';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import { Camera, User } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

const ProfileSettings = () => {
  const { user, updateUserState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [profile, setProfile] = useState(null);
  const imageRef = useRef();
  const bannerRef = useRef();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(profileSchema),
  });

  useEffect(() => {
    profileApi.getMyDetails()
      .then(({ data }) => {
        const p = data.data || data.profile || data;
        setProfile(p);
        reset({
          firstName: p.userId?.firstName || user?.firstName || '',
          lastName: p.userId?.lastName || user?.lastName || '',
          bio: p.bio || '',
          specialties: p.specialties || '',
          location: p.location || '',
          website: p.website || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await profileApi.updateMe(data);
      updateUserState({ firstName: data.firstName, lastName: data.lastName });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    const setter = type === 'image' ? setUploadingImage : setUploadingBanner;
    setter(true);
    try {
      const fn = type === 'image' ? profileApi.uploadImage : profileApi.uploadBanner;
      const { data } = await fn(file);
      const url = data.data?.imageUrl || data.data?.bannerUrl || data.imageUrl || data.bannerUrl;
      if (type === 'image') updateUserState({ profileImage: url });
      toast.success(`${type === 'image' ? 'Profile photo' : 'Banner'} updated!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setter(false);
    }
  };

  if (loading) return <Loader />;

  const labelClass = 'block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1';

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
      </div>

      {/* Avatar & Banner */}
      <div className="card p-5 mb-5">
        <h3 className="font-semibold mb-4">Photos</h3>

        {/* Banner */}
        <div
          className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-r from-brand-400 to-brand-600 mb-4 cursor-pointer group"
          onClick={() => bannerRef.current?.click()}
        >
          {profile?.bannerImage && (
            <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadingBanner ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        </div>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleImageUpload(e.target.files?.[0], 'banner')} />

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer group" onClick={() => imageRef.current?.click()}>
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingImage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          <div>
            <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-surface-500">Click photo to change</p>
          </div>
        </div>
        <input ref={imageRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleImageUpload(e.target.files?.[0], 'image')} />
      </div>

      {/* Profile form */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">Personal Information</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
          </div>

          <div>
            <label className={labelClass}>Bio</label>
            <textarea className="input-base resize-none h-24" placeholder="Tell the world about yourself..." {...register('bio')} />
            {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
          </div>

          <Input label="Specialties" placeholder="e.g. Italian cuisine, Pastry" error={errors.specialties?.message} {...register('specialties')} />
          <Input label="Location" placeholder="e.g. Kathmandu, Nepal" error={errors.location?.message} {...register('location')} />
          <Input label="Website" type="url" placeholder="https://yoursite.com" error={errors.website?.message} {...register('website')} />

          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
