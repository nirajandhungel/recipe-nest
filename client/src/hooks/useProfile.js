import { useState, useCallback } from 'react';
import { profileApi } from '../api/profileApi';
import toast from 'react-hot-toast';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    setLoading(true);
    try {
      const { data } = await profileApi.getById(userId);
      setProfile(data.data || data.profile || data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Profile not found');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await profileApi.getMyDetails();
      setProfile(data.data || data.profile || data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, fetchProfile, fetchMyProfile };
};
