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
  const [previewImage, setPreviewImage] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
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
      
    return () => {
      // Cleanup preview URLs
      if (previewImage) URL.revokeObjectURL(previewImage);
      if (previewBanner) URL.revokeObjectURL(previewBanner);
    };
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

    // Size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const isAvatar = type === 'image';
    const setter = isAvatar ? setUploadingImage : setUploadingBanner;
    const previewSetter = isAvatar ? setPreviewImage : setPreviewBanner;
    
    // Create optimistic preview
    const previewUrl = URL.createObjectURL(file);
    previewSetter(previewUrl);
    setter(true);

    const toastId = toast.loading(`Uploading ${isAvatar ? 'photo' : 'banner'}...`);

    try {
      const fn = isAvatar ? profileApi.uploadImage : profileApi.uploadBanner;
      const { data } = await fn(file);
      const url = data.data?.imageUrl || data.data?.bannerUrl || data.imageUrl || data.bannerUrl;
      
      if (isAvatar) {
        updateUserState({ profileImage: url });
      } else {
        setProfile(prev => ({ ...prev, bannerImage: url }));
      }
      
      toast.success(`${isAvatar ? 'Profile photo' : 'Banner'} updated!`, { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed', { id: toastId });
      // Reset preview on error
      previewSetter(null);
    } finally {
      setter(false);
      // We keep the preview for a bit to ensure smooth transition, 
      // but Cloudinary URLs can be slow to propagate.
      // Actually, once we have the URL, we should switch to it.
    }
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  const labelClass = 'block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1';

  return (
    <div className="max-w-2xl px-4 py-8 mx-auto sm:px-0">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
          <User className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
          <p className="text-sm text-surface-500">Manage your public profile and preferences</p>
        </div>
      </div>

      {/* Avatar & Banner */}
      <div className="card p-0 overflow-hidden mb-8 border-surface-200 dark:border-surface-800">
        <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
          <h3 className="font-display font-bold text-lg">Public Images</h3>
          <span className="text-xs text-surface-400">Resolution matters for a great profile</span>
        </div>
        
        <div className="p-5">
          {/* Banner */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-surface-500 mb-2 uppercase tracking-wider">Banner Image</label>
            <div
              className="relative h-40 sm:h-48 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 cursor-pointer group"
              onClick={() => !uploadingBanner && bannerRef.current?.click()}
            >
              {(previewBanner || profile?.bannerImage) ? (
                <img 
                  src={previewBanner || profile.bannerImage} 
                  alt="Banner" 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${uploadingBanner ? 'opacity-50' : 'opacity-100'}`} 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 opacity-20" />
              )}
              
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${uploadingBanner ? 'bg-black/20 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                {uploadingBanner ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Uploading...</span>
                  </div>
                ) : (
                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImageUpload(e.target.files?.[0], 'banner')} />
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div 
              className="relative cursor-pointer group" 
              onClick={() => !uploadingImage && imageRef.current?.click()}
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-white dark:ring-surface-900 shadow-xl bg-surface-100 dark:bg-surface-800">
                {(previewImage || user?.profileImage) ? (
                  <img 
                    src={previewImage || user.profileImage} 
                    alt="" 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${uploadingImage ? 'opacity-50' : 'opacity-100'}`} 
                  />
                ) : (
                  <div className="w-full h-full bg-brand-50 text-brand-700 flex items-center justify-center text-3xl font-bold">
                    {getInitials(user?.firstName, user?.lastName)}
                  </div>
                )}
              </div>
              
              <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300 ${uploadingImage ? 'bg-black/20 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                {uploadingImage ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <h4 className="font-display font-bold text-lg text-surface-900 dark:text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </h4>
              <p className="text-surface-500 text-sm mb-3">@{user?.username || 'user'}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => imageRef.current?.click()}
                disabled={uploadingImage}
              >
                Change Photo
              </Button>
            </div>
          </div>
          <input ref={imageRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleImageUpload(e.target.files?.[0], 'image')} />
        </div>
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
