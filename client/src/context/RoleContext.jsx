import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { ROLES } from '../constants/roles';

const RoleContext = createContext(null);

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();

  const role = user?.role || null;
  const isUser = role === ROLES.USER;
  const isChef = role === ROLES.CHEF;
  const isAdmin = role === ROLES.ADMIN;
  const isAuthenticated = !!user;
  const canCreateRecipe = isChef || isAdmin;

  return (
    <RoleContext.Provider value={{ role, isUser, isChef, isAdmin, isAuthenticated, canCreateRecipe }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};
