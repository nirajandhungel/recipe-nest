import * as Yup from 'yup';

export const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
});

export const registerSchema = Yup.object({
  firstName: Yup.string().min(2, 'Min 2 characters').required('First name is required'),
  lastName: Yup.string().min(2, 'Min 2 characters').required('Last name is required'),
  username: Yup.string()
    .min(3, 'Min 3 characters')
    .max(30, 'Max 30 characters')
    .matches(/^[a-z0-9_.-]+$/, 'Lowercase letters, numbers, dots, hyphens only')
    .required('Username is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm password'),
  role: Yup.string().oneOf(['user', 'chef']).required('Select a role'),
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

export const resetPasswordSchema = Yup.object({
  password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm password'),
});

export const recipeSchema = Yup.object({
  title: Yup.string().min(5).max(200).required('Title is required'),
  description: Yup.string().min(20).max(2000).required('Description is required'),
  cuisineType: Yup.string().required('Cuisine type is required'),
  difficulty: Yup.string().required('Difficulty is required'),
  mealType: Yup.string().required('Meal type is required'),
  prepTimeMinutes: Yup.number().min(0).max(480).required('Prep time is required'),
  cookTimeMinutes: Yup.number().min(0).max(480).required('Cook time is required'),
  servings: Yup.number().min(1).max(100).required('Servings is required'),
});

export const profileSchema = Yup.object({
  firstName: Yup.string().min(2).required('First name is required'),
  lastName: Yup.string().min(2).required('Last name is required'),
  bio: Yup.string().max(500),
  specialties: Yup.string(),
  location: Yup.string(),
  website: Yup.string().url('Enter a valid URL').nullable().transform(v => v === '' ? null : v),
});

export const commentSchema = Yup.object({
  content: Yup.string().min(1).max(500).required('Comment cannot be empty'),
});
