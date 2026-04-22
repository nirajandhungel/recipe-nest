import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { resetPasswordSchema } from '../../utils/validators';
import { authApi } from '../../api/authApi';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async ({ password }) => {
    if (!token) { toast.error('Invalid reset link'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset successfully!');
      navigate('/auth/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed');
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

        <h2 className="font-display text-2xl font-bold mb-1">Set new password</h2>
        <p className="text-surface-500 text-sm mb-6">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="New Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm Password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
        </form>

        <Link to="/auth/login" className="text-sm text-surface-500 hover:text-surface-700 mt-4 block text-center">Back to login</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
