import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'some time ago';
  }
};

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  try {
    return format(new Date(date), fmt);
  } catch {
    return '';
  }
};

export const getInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const getUserProfileImage = (user = {}) =>
  user?.profileImage ||
  user?.profile?.profileImage ||
  user?.userId?.profileImage ||
  user?.author?.profileImage ||
  null;

export const truncate = (str, n = 120) =>
  str?.length > n ? `${str.slice(0, n)}...` : str;

export const buildQueryString = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  return q.toString();
};

export const difficultyColor = (level) => ({
  Easy: 'bg-brand-50 text-brand-700',
  Medium: 'bg-emerald-100 text-emerald-700',
  Hard: 'bg-green-200 text-green-800',
}[level] || 'bg-surface-100 text-surface-600');

export const statusColor = (status) => ({
  published: 'bg-brand-100 text-brand-800',
  draft: 'bg-surface-100 text-surface-600',
  archived: 'bg-surface-200 text-surface-700',
  pending: 'bg-emerald-100 text-emerald-700',
}[status] || 'bg-surface-100 text-surface-600');
