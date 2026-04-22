const TOKEN_KEY = 'rn_access_token';
const REFRESH_KEY = 'rn_refresh_token';
const USER_KEY = 'rn_user';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => localStorage.removeItem(TOKEN_KEY),
};

export const refreshTokenStorage = {
  get: () => localStorage.getItem(REFRESH_KEY),
  set: (token) => localStorage.setItem(REFRESH_KEY, token),
  remove: () => localStorage.removeItem(REFRESH_KEY),
};

export const userStorage = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  set: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  remove: () => localStorage.removeItem(USER_KEY),
};

export const clearAuth = () => {
  tokenStorage.remove();
  refreshTokenStorage.remove();
  userStorage.remove();
};