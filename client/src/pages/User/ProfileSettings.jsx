import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import { Camera, User, Globe, Link as LinkIcon, MapPin, Briefcase, Instagram, Youtube, Twitter, Facebook, Linkedin, Chrome as TikTokIcon } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

const urlField = Yup.string().transform(v => (!v || v === '') ? undefined : v).url('Enter a valid URL').notRequired();

const profileSchema = Yup.object({
  firstName: Yup.string().min(2).required('First name is required'),
  lastName: Yup.string().min(2).required('Last name is required'),
  bio: Yup.string().max(500),
  specialties: Yup.string(),
  location: Yup.string(),
  website: urlField,
  socialLinks: Yup.object({
    instagram: urlField,
    youtube: urlField,
    twitter: urlField,
    facebook: urlField,
    linkedin: urlField,
    tiktok: urlField,
  }).notRequired(),
});



const ProfileSettings = () => {
  const { user, updateUserState } = useAuth();
  const { isChef } = useRole();
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
          socialLinks: {
            instagram: p.socialLinks?.instagram || '',
            youtube: p.socialLinks?.youtube || '',
            twitter: p.socialLinks?.twitter || '',
            tiktok: p.socialLinks?.tiktok || '',
          },
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));

    return () => {
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
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const isAvatar = type === 'image';
    const setter = isAvatar ? setUploadingImage : setUploadingBanner;
    const previewSetter = isAvatar ? setPreviewImage : setPreviewBanner;

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
      previewSetter(null);
    } finally {
      setter(false);
    }
  };

  if (loading) return <div className="py-20"><Loader /></div>;

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
          <User className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
          <p className="text-sm text-surface-400">Manage your public profile and preferences</p>
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN — Images & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Card */}
          <div className="card border border-surface-200 dark:border-surface-800 p-5">
            <div className="flex flex-col items-center text-center">
              <div
                className="relative cursor-pointer group mb-4"
                onClick={() => !uploadingImage && imageRef.current?.click()}
              >
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-surface-100 dark:ring-surface-800 shadow-lg bg-surface-100 dark:bg-surface-800">
                  {(previewImage || user?.profileImage) ? (
                    <img
                      src={previewImage || user.profileImage}
                      alt=""
                      className={`w-full h-full object-cover transition-opacity ${uploadingImage ? 'opacity-50' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-3xl font-bold">
                      {getInitials(user?.firstName, user?.lastName)}
                    </div>
                  )}
                </div>
                <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all ${uploadingImage ? 'bg-black/30 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                  {uploadingImage ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <h3 className="font-display font-bold text-lg">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-surface-400 mb-3">@{user?.username}</p>
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                disabled={uploadingImage}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Change Photo
              </button>
              <input ref={imageRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0], 'image')} />
            </div>
          </div>

          {/* Banner Card */}
          <div className="card border border-surface-200 dark:border-surface-800 p-5">
            <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Banner Image</h4>
            <div
              className="relative h-32 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 cursor-pointer group"
              onClick={() => !uploadingBanner && bannerRef.current?.click()}
            >
              {(previewBanner || profile?.bannerImage) ? (
                <img
                  src={previewBanner || profile.bannerImage}
                  alt="Banner"
                  className={`w-full h-full object-cover transition-opacity ${uploadingBanner ? 'opacity-50' : ''}`}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-300 to-brand-500 opacity-30" />
              )}
              <div className={`absolute inset-0 flex items-center justify-center transition-all ${uploadingBanner ? 'bg-black/20 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                {uploadingBanner ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-5 h-5 text-white" />
                    <span className="text-[11px] text-white font-medium">Change Banner</span>
                  </div>
                )}
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImageUpload(e.target.files?.[0], 'banner')} />
          </div>

          {/* Social Media Links — Chef only */}
          {isChef && (
            <div className="card border border-surface-200 dark:border-surface-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-4 h-4 text-brand-500" />
                <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Social Links</h4>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    <label className="text-xs font-medium text-surface-500">Instagram</label>
                  </div>
                  <input type="url" placeholder="https://instagram.com/you" className="input-base text-sm" {...register('socialLinks.instagram')} />
                  {errors.socialLinks?.instagram && <p className="text-xs text-red-500 mt-0.5">{errors.socialLinks.instagram.message}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    <label className="text-xs font-medium text-surface-500">Facebook</label>
                  </div>
                  <input type="url" placeholder="https://facebook.com/you" className="input-base text-sm" {...register('socialLinks.facebook')} />
                  {errors.socialLinks?.facebook && <p className="text-xs text-red-500 mt-0.5">{errors.socialLinks.facebook.message}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <label className="text-xs font-medium text-surface-500">YouTube</label>
                  </div>
                  <input type="url" placeholder="https://youtube.com/@you" className="input-base text-sm" {...register('socialLinks.youtube')} />
                  {errors.socialLinks?.youtube && <p className="text-xs text-red-500 mt-0.5">{errors.socialLinks.youtube.message}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Twitter className="w-3.5 h-3.5 text-sky-500" />
                    <label className="text-xs font-medium text-surface-500">X / Twitter</label>
                  </div>
                  <input type="url" placeholder="https://x.com/you" className="input-base text-sm" {...register('socialLinks.twitter')} />
                  {errors.socialLinks?.twitter && <p className="text-xs text-red-500 mt-0.5">{errors.socialLinks.twitter.message}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Linkedin className="w-3.5 h-3.5 text-blue-700" />
                    <label className="text-xs font-medium text-surface-500">LinkedIn</label>
                  </div>
                  <input type="url" placeholder="https://linkedin.com/in/you" className="input-base text-sm" {...register('socialLinks.linkedin')} />
                  {errors.socialLinks?.linkedin && <p className="text-xs text-red-500 mt-0.5">{errors.socialLinks.linkedin.message}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TikTokIcon className="w-3.5 h-3.5 text-surface-700 dark:text-surface-300" />
                    <label className="text-xs font-medium text-surface-500">TikTok</label>
                  </div>
                  <input type="url" placeholder="https://tiktok.com/@you" className="input-base text-sm" {...register('socialLinks.tiktok')} />
                  {errors.socialLinks?.tiktok && <p className="text-xs text-red-500 mt-0.5">{errors.socialLinks.tiktok.message}</p>}
                </div>

                <Button type="submit" loading={saving} className="w-full">Save All</Button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Form */}
        <div className="lg:col-span-2">
          <div className="card border border-surface-200 dark:border-surface-800 p-6">
            <h3 className="font-display font-bold text-lg mb-5">Personal Information</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
                <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Bio</label>
                <textarea
                  className="input-base resize-none h-28"
                  placeholder="Tell the world about yourself..."
                  {...register('bio')}
                />
                {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-surface-400" /> Specialties</span>
                  </label>
                  <input className="input-base" placeholder="e.g. Italian cuisine, Pastry" {...register('specialties')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-surface-400" /> Location</span>
                  </label>
                  <input className="input-base" placeholder="e.g. Kathmandu, Nepal" {...register('location')} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-surface-400" /> Website</span>
                </label>
                <input type="url" className="input-base" placeholder="https://yoursite.com" {...register('website')} />
                {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website.message}</p>}
              </div>

              <div className="pt-2">
                <Button type="submit" loading={saving}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
