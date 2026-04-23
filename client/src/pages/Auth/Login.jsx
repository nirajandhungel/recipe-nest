import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

import AuthLayout from './AuthLayout';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const user = await login(data);

      toast.success(`Welcome back, ${user.firstName}!`);

      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'chef') navigate('/chef/recipes');
      else navigate(from);

    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back to "
      subtitle="Where passionate chefs share their culinary art with the world."
    >
      <div className="w-full max-w-sm py-8">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">
            RecipeNest
          </span>
        </div>

        <h2 className="font-display text-2xl font-bold mb-1">
          Sign in
        </h2>


        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-brand-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Sign in
          </Button>

                  <p className="text-surface-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            className="text-brand-600 hover:underline"
          >
            Sign up
          </Link>
        </p>

        </form>

      </div>
    </AuthLayout>
  );
};

export default Login;