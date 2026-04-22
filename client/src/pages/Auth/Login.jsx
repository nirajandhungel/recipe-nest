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

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm({
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
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 to-brand-700 text-white flex-col items-center justify-center p-12">
        <ChefHat className="w-16 h-16 mb-6 opacity-90" />
        <h1 className="font-display text-4xl font-bold mb-4 text-center">Welcome back to RecipeNest</h1>
        <p className="text-brand-100 text-lg text-center max-w-xs">Where passionate chefs share their culinary art with the world.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">RecipeNest</span>
          </div>

          <h2 className="font-display text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-surface-500 text-sm mb-6">Don't have an account? <Link to="/auth/register" className="text-brand-600 hover:underline">Sign up</Link></p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <div className="flex justify-end">
              <Link to="/auth/forgot-password" className="text-sm text-brand-600 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">Sign in</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
