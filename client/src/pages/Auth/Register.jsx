import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

import AuthLayout from './AuthLayout';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: { role: 'user' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const { confirmPassword, ...payload } = data;

      await registerUser(payload);

      toast.success(
        'Account created! Please log in.'
      );

      navigate('/auth/login');

    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join "
      subtitle="Share your passion for food with millions of food lovers."
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
          Create your account
        </h2>


        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Jane"
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Username"
            placeholder="janedoe"
            error={errors.username?.message}
            {...register('username')}
          />

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
            placeholder="Min 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              I want to join as
            </label>

            <div className="grid grid-cols-2 gap-3">

              {[
                {
                  value: 'user',
                  label: 'Food Lover',
                  desc: 'Discover & save recipes',
                },
                {
                  value: 'chef',
                  label: '👨‍🍳 Chef',
                  desc: 'Create & share recipes',
                },
              ].map(({ value, label, desc }) => (

                <label
                  key={value}
                  className="cursor-pointer"
                >

                  <input
                    type="radio"
                    value={value}
                    className="sr-only"
                    {...register('role')}
                  />

                  <div
                    className={`border-2 rounded-xl p-3 text-center transition-all ${
                      selectedRole === value
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/10'
                        : errors.role
                        ? 'border-red-300'
                        : 'border-surface-200 hover:border-brand-400'
                    }`}
                  >

                    <div
                      className={`font-medium text-sm ${
                        selectedRole === value
                          ? 'text-brand-700'
                          : ''
                      }`}
                    >
                      {label}
                    </div>

                    <div className="text-xs text-surface-500 mt-0.5">
                      {desc}
                    </div>

                  </div>

                </label>

              ))}

            </div>

            {errors.role && (
              <p className="text-xs text-red-500 mt-1">
                {errors.role.message}
              </p>
            )}

          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Create Account
          </Button>
                         <p className="text-surface-500 text-sm mt-6 ">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="text-brand-600 hover:underline"
          >
            Sign in
          </Link>
        </p>

        </form>

      </div>
    </AuthLayout>
  );
};

export default Register;