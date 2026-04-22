'use strict';

const { z } = require('zod');
const {
  CUISINE_TYPES,
  DIFFICULTY_LEVELS,
  MEAL_TYPES,
  PASSWORD_MIN_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  BIO_MAX_LENGTH,
  RECIPE_TITLE_MAX_LENGTH,
  RECIPE_DESCRIPTION_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
} = require('../constants');

// ─── Auth Validators ────────────────────────────────────────────────────────

const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50),
  username: z
    .string()
    .trim()
    .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
    .max(USERNAME_MAX_LENGTH, `Username cannot exceed ${USERNAME_MAX_LENGTH} characters`)
    .regex(
      /^[a-z0-9_.-]+$/,
      'Username can only contain lowercase letters, numbers, dots, hyphens, and underscores'
    ),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  role: z.enum(['user', 'chef']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const passwordResetSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Profile Validators ────────────────────────────────────────────────────

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50).optional(),
    lastName: z.string().trim().min(2).max(50).optional(),
    bio: z.string().trim().max(BIO_MAX_LENGTH, `Bio cannot exceed ${BIO_MAX_LENGTH} characters`).optional(),
    specialties: z.string().trim().optional(),
    speciality: z.string().trim().optional(),
    location: z.string().trim().optional(),
    website: z.string().url().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
    experience: z.string().trim().optional(),
    socialLinks: z
      .object({
        instagram: z.string().url().optional(),
        youtube: z.string().url().optional(),
        twitter: z.string().url().optional(),
        website: z.string().url().optional(),
        tiktok: z.string().url().optional(),
      })
      .optional(),
  });

// ─── Recipe Validators ────────────────────────────────────────────────────

const ingredientSchema = z.object({
  name: z.string().trim().min(1, 'Ingredient name is required'),
  quantity: z.number().min(0.1, 'Quantity must be greater than 0'),
  unit: z.string().trim().min(1, 'Unit is required'),
});

const recipeStepSchema = z.object({
  stepNumber: z.number().int().min(1, 'Step number must be at least 1'),
  instruction: z
    .string()
    .trim()
    .min(5, 'Instruction must be at least 5 characters')
    .max(1000, 'Instruction cannot exceed 1000 characters'),
  imageUrl: z.string().url().optional(),
});

const createRecipeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Recipe title must be at least 5 characters')
      .max(RECIPE_TITLE_MAX_LENGTH, `Recipe title cannot exceed ${RECIPE_TITLE_MAX_LENGTH} characters`),
    description: z
      .string()
      .trim()
      .min(20, 'Description must be at least 20 characters')
      .max(RECIPE_DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${RECIPE_DESCRIPTION_MAX_LENGTH} characters`),
    ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
    steps: z.array(recipeStepSchema).min(1, 'At least one step is required'),
    cuisineType: z.enum(CUISINE_TYPES, { errorMap: () => ({ message: 'Invalid cuisine type' }) }),
    difficulty: z.enum(DIFFICULTY_LEVELS, { errorMap: () => ({ message: 'Invalid difficulty level' }) }),
    mealType: z.enum(MEAL_TYPES, { errorMap: () => ({ message: 'Invalid meal type' }) }),
    prepTimeMinutes: z.number().int().min(0, 'Prep time cannot be negative').max(480, 'Prep time cannot exceed 8 hours'),
    cookTimeMinutes: z.number().int().min(0, 'Cook time cannot be negative').max(480, 'Cook time cannot exceed 8 hours'),
    servings: z.number().int().min(1, 'Servings must be at least 1').max(100, 'Servings cannot exceed 100'),
    tags: z.array(z.string().trim()).optional(),
    status: z.enum(['draft', 'published']).optional(),
  })
  .strict();

const updateRecipeSchema = createRecipeSchema.partial();

// ─── Social Interaction Validators ─────────────────────────────────────────

const createCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(COMMENT_MAX_LENGTH, `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters`)
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(COMMENT_MAX_LENGTH, `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters`)
    .optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
}).transform(data => ({
  text: data.text || data.content,
  rating: data.rating,
}));

// ─── Pagination Validator ──────────────────────────────────────────────────

const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Page must be a positive number')
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 50, 'Limit must be between 1 and 50')
    .optional(),
});

// ─── Validation Function Helper ────────────────────────────────────────────

const validateData = (schema, data) => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.flatten().fieldErrors;
      return {
        success: false,
        errors: Object.entries(errors).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {}),
      };
    }
    return { success: false };
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  passwordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
  createRecipeSchema,
  updateRecipeSchema,
  createCommentSchema,
  paginationSchema,
  validateData,
};
