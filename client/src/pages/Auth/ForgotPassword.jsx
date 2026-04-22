import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { forgotPasswordSchema } from '../../utils/validators';
import { authApi } from '../../api/authApi';
import { Link } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ChefHat, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">RecipeNest</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Check your inbox</h2>
            <p className="text-surface-500 text-sm mb-6">We've sent a password reset link to your email address.</p>
            <Link to="/auth/login" className="btn-primary">Back to Login</Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-1">Forgot password?</h2>
            <p className="text-surface-500 text-sm mb-6">Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
            </form>
            <Link to="/auth/login" className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mt-4">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
