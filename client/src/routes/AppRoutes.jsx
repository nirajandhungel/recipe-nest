import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';

// Public
import Home from '../pages/Public/Home';
import Recipes from '../pages/Public/Recipes';
import RecipeDetails from '../pages/Public/RecipeDetails';
import Chefs from '../pages/Public/Chefs';
import ProfileView from '../pages/Public/ProfileView';
import SearchPage from '../pages/Public/SearchPage';

// User
import SavedRecipes from '../pages/User/SavedRecipes';
import Followers from '../pages/User/Followers';
import Following from '../pages/User/Following';
import ProfileSettings from '../pages/User/ProfileSettings';

// Chef
import MyRecipes from '../pages/Chef/MyRecipes';
import CreateRecipe from '../pages/Chef/CreateRecipe';
import EditRecipe from '../pages/Chef/EditRecipe';
import ChefAnalytics from '../pages/Chef/Analytics';

// Admin
import AdminDashboard from '../pages/Admin/Dashboard';
import AdminUsers from '../pages/Admin/Users';
import PendingRecipes from '../pages/Admin/PendingRecipes';
import AuditLogs from '../pages/Admin/AuditLogs';
import PlatformStats from '../pages/Admin/PlatformStats';

const AppRoutes = () => (
  <Routes>
    {/* Auth routes */}
    <Route path="/auth/login" element={<Login />} />
    <Route path="/auth/register" element={<Register />} />
    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
    <Route path="/auth/reset-password" element={<ResetPassword />} />

    {/* Public routes */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/recipes" element={<Recipes />} />
      <Route path="/recipes/:id" element={<RecipeDetails />} />
      <Route path="/chefs" element={<Chefs />} />
      <Route path="/profile/:userId" element={<ProfileView />} />
      <Route path="/search" element={<SearchPage />} />
    </Route>

    {/* Authenticated user routes */}
    <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
      <Route path="/saved" element={<SavedRecipes />} />
      <Route path="/followers" element={<Followers />} />
      <Route path="/following" element={<Following />} />
      <Route path="/settings/profile" element={<ProfileSettings />} />
    </Route>

    {/* Chef routes */}
    <Route element={<RoleRoute roles={['chef', 'admin']}><DashboardLayout /></RoleRoute>}>
      <Route path="/chef/recipes" element={<MyRecipes />} />
      <Route path="/chef/recipes/create" element={<CreateRecipe />} />
      <Route path="/chef/recipes/:id/edit" element={<EditRecipe />} />
      <Route path="/chef/analytics" element={<ChefAnalytics />} />
    </Route>

    {/* Admin routes */}
    <Route element={<RoleRoute roles={['admin']}><DashboardLayout /></RoleRoute>}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/recipes/pending" element={<PendingRecipes />} />
      <Route path="/admin/audit-logs" element={<AuditLogs />} />
      <Route path="/admin/stats" element={<PlatformStats />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
