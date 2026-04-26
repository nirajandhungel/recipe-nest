'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'RecipeNest API',
    version: '2.0.0',
    description: `
## RecipeNest — Nepal's #1 Recipe Sharing & Chef Portfolio Platform

A full-stack REST API powering RecipeNest, built with **Node.js**, **Express 5**, **MongoDB Atlas**, and **Socket.IO v4**.
`,
    contact: {
      name: 'Nirajan Dhungel',
      url: 'https://www.nirajandhungel.com.np/',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development',
    },
    {
      url: 'https://recipe-nest-zgdx.onrender.com/api',
      description: 'Production (Render)',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User registration, login, token management, password reset' },
    { name: 'Recipes', description: 'Recipe CRUD, publishing, and browsing' },
    { name: 'Profiles', description: 'Chef profile management and public profiles' },
    { name: 'Social', description: 'Likes, saves, comments, follows' },
    { name: 'Search', description: 'Recipe and chef search with filters' },
    { name: 'Chat', description: 'Real-time messaging conversations' },
    { name: 'Analytics', description: 'Chef engagement analytics and dashboards' },
    { name: 'Admin', description: 'User management, recipe moderation, audit logs' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token (15-minute expiry)',
      },
    },
    schemas: {
      // ── User ──
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '663f1a2b3c4d5e6f7a8b9c0d' },
          firstName: { type: 'string', example: 'Nirajan' },
          lastName: { type: 'string', example: 'Dhungel' },
          username: { type: 'string', example: 'nirajan_chef' },
          email: { type: 'string', format: 'email', example: 'nirajan@recipenest.com' },
          role: { type: 'string', enum: ['user', 'chef', 'admin'], example: 'chef' },
          status: { type: 'string', enum: ['active', 'inactive', 'suspended', 'deleted'], example: 'active' },
          followerCount: { type: 'integer', example: 150 },
          followingCount: { type: 'integer', example: 42 },
          recipeCount: { type: 'integer', example: 25 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Profile ──
      Profile: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          bio: { type: 'string', example: 'Professional chef specializing in Nepali cuisine' },
          specialties: { type: 'array', items: { type: 'string' }, example: ['Nepali', 'Italian'] },
          location: { type: 'string', example: 'Kathmandu, Nepal' },
          profileImage: { type: 'string', format: 'uri' },
          bannerImage: { type: 'string', format: 'uri' },
          socialLinks: {
            type: 'object',
            properties: {
              instagram: { type: 'string' },
              youtube: { type: 'string' },
              twitter: { type: 'string' },
              tiktok: { type: 'string' },
              website: { type: 'string' },
            },
          },
          isFeatured: { type: 'boolean' },
          rating: { type: 'number', example: 4.5 },
          totalLikes: { type: 'integer' },
        },
      },

      // ── Recipe ──
      Recipe: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string', example: 'Kathmandu Chicken Momos' },
          description: { type: 'string' },
          chefId: { $ref: '#/components/schemas/User' },
          cuisineType: { type: 'string', enum: ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'French', 'American', 'Mediterranean', 'Thai', 'Nepali', 'Other'] },
          difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
          mealType: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'] },
          cookTime: { type: 'integer', example: 30 },
          prepTime: { type: 'integer', example: 15 },
          servings: { type: 'integer', example: 4 },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'chicken mince' },
                quantity: { type: 'number', example: 500 },
                unit: { type: 'string', example: 'grams' },
              },
            },
          },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                stepNumber: { type: 'integer', example: 1 },
                instruction: { type: 'string', example: 'Mix the chicken mince with spices' },
                imageUrl: { type: 'string', format: 'uri' },
              },
            },
          },
          imageUrl: { type: 'string', format: 'uri' },
          tags: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['draft', 'pending', 'published', 'rejected', 'archived'] },
          views: { type: 'integer' },
          likes: { type: 'integer' },
          saves: { type: 'integer' },
          comments: { type: 'integer' },
          isPublished: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Ingredient ──
      Ingredient: {
        type: 'object',
        required: ['name', 'quantity', 'unit'],
        properties: {
          name: { type: 'string', minLength: 1 },
          quantity: { type: 'number', minimum: 0 },
          unit: { type: 'string', minLength: 1 },
        },
      },

      // ── Step ──
      Step: {
        type: 'object',
        required: ['stepNumber', 'instruction'],
        properties: {
          stepNumber: { type: 'integer', minimum: 1 },
          instruction: { type: 'string', minLength: 10, maxLength: 1000 },
        },
      },

      // ── Comment ──
      Comment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { $ref: '#/components/schemas/User' },
          recipeId: { type: 'string' },
          text: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Conversation ──
      Conversation: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          participants: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          lastMessage: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              senderId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['sent', 'delivered', 'seen'] },
            },
          },
          unreadCounts: { type: 'object', additionalProperties: { type: 'integer' } },
        },
      },

      // ── Message ──
      Message: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          conversationId: { type: 'string' },
          senderId: { $ref: '#/components/schemas/User' },
          text: { type: 'string', maxLength: 2000 },
          status: { type: 'string', enum: ['sent', 'delivered', 'seen'], description: '1 tick = sent, 2 grey ticks = delivered, 2 blue ticks = seen' },
          deliveredAt: { type: 'string', format: 'date-time' },
          seenAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── AuditLog ──
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          adminId: { type: 'string' },
          action: { type: 'string', enum: ['user_created', 'user_updated', 'user_deleted', 'user_suspended', 'recipe_created', 'recipe_updated', 'recipe_deleted', 'recipe_published', 'recipe_flagged', 'comment_deleted', 'admin_action'] },
          targetId: { type: 'string' },
          targetType: { type: 'string' },
          details: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Standard Responses ──
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT access token (15-min expiry)' },
          refreshToken: { type: 'string', description: 'JWT refresh token (7-day expiry)' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },

  // ── PATH DEFINITIONS ──
  paths: {
    // ═════════════════════════════════════════════════════════
    // AUTHENTICATION
    // ═════════════════════════════════════════════════════════
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user or chef',
        description: 'Creates a new user account. If role is "chef", a Profile document is also auto-created.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'username', 'email', 'password', 'role'],
                properties: {
                  firstName: { type: 'string', example: 'Nirajan' },
                  lastName: { type: 'string', example: 'Dhungel' },
                  username: { type: 'string', example: 'nirajan_chef', minLength: 3, maxLength: 30 },
                  email: { type: 'string', format: 'email', example: 'nirajan@recipenest.com' },
                  password: { type: 'string', minLength: 8, example: 'MySecurePass123!' },
                  role: { type: 'string', enum: ['user', 'chef'], example: 'chef' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          409: { description: 'Email or username already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        description: 'Returns a 15-min JWT access token and a 7-day refresh token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'nirajan@recipenest.com' },
                  password: { type: 'string', example: 'MySecurePass123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          401: { description: 'Invalid email or password (generic to prevent enumeration)' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Exchange a valid refresh token for a new access token (token rotation).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'New access token issued' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset email',
        description: 'Sends a time-limited reset token to the user\'s email via Resend.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset link sent' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successfully' },
          400: { description: 'Invalid or expired token' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify email address',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Email verified' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user data', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Not authenticated' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout and invalidate refresh token',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Logged out' } },
      },
    },

    // ═════════════════════════════════════════════════════════
    // RECIPES
    // ═════════════════════════════════════════════════════════
    '/recipes': {
      get: {
        tags: ['Recipes'],
        summary: 'List published recipes (paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'cuisine', in: 'query', schema: { type: 'string' } },
          { name: 'difficulty', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Paginated recipe list' },
        },
      },
      post: {
        tags: ['Recipes'],
        summary: 'Create a new recipe (Chef only)',
        description: 'Create a recipe with image upload. Requires chef role. Image uploaded to Cloudinary.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'cuisineType', 'difficulty', 'mealType', 'cookTime', 'prepTime', 'servings', 'ingredients', 'steps'],
                properties: {
                  title: { type: 'string', minLength: 5, maxLength: 200 },
                  description: { type: 'string', minLength: 20, maxLength: 2000 },
                  cuisineType: { type: 'string', enum: ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'French', 'American', 'Mediterranean', 'Thai', 'Nepali', 'Other'] },
                  difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
                  mealType: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'] },
                  cookTime: { type: 'integer' },
                  prepTime: { type: 'integer' },
                  servings: { type: 'integer' },
                  ingredients: { type: 'string', description: 'JSON array of {name, quantity, unit}' },
                  steps: { type: 'string', description: 'JSON array of {stepNumber, instruction}' },
                  tags: { type: 'string', description: 'JSON array of tag strings' },
                  image: { type: 'string', format: 'binary', description: 'Recipe image (max 5MB, jpg/png/webp)' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Recipe created with Cloudinary image URL' },
          403: { description: 'Not a chef' },
          422: { description: 'Zod validation error' },
        },
      },
    },
    '/recipes/chef/{chefId}': {
      get: {
        tags: ['Recipes'],
        summary: 'Get recipes by a specific chef',
        parameters: [{ name: 'chefId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Chef recipe list' } },
      },
    },
    '/recipes/{id}': {
      get: {
        tags: ['Recipes'],
        summary: 'Get single recipe (increments view count)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Recipe details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Recipe' } } } },
          404: { description: 'Recipe not found' },
        },
      },
      put: {
        tags: ['Recipes'],
        summary: 'Update recipe (owner chef only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, image: { type: 'string', format: 'binary' } } } } } },
        responses: {
          200: { description: 'Recipe updated' },
          403: { description: 'Not authorized to modify this recipe' },
        },
      },
      delete: {
        tags: ['Recipes'],
        summary: 'Delete recipe (owner chef only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Recipe deleted' }, 403: { description: 'Forbidden' } },
      },
    },
    '/recipes/{id}/publish': {
      post: {
        tags: ['Recipes'],
        summary: 'Submit recipe for admin review',
        description: 'Changes status from "draft" to "pending". Admin must approve before it goes public.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Status changed to pending' } },
      },
    },

    // ═════════════════════════════════════════════════════════
    // PROFILES
    // ═════════════════════════════════════════════════════════
    '/profiles': {
      get: {
        tags: ['Profiles'],
        summary: 'List all chef profiles',
        responses: { 200: { description: 'Profile list' } },
      },
    },
    '/profiles/search': {
      get: {
        tags: ['Profiles'],
        summary: 'Search chef profiles',
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'Search results' } },
      },
    },
    '/profiles/{userId}': {
      get: {
        tags: ['Profiles'],
        summary: 'Get public chef profile',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Profile data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } },
          404: { description: 'Profile not found' },
        },
      },
    },
    '/profiles/{userId}/stats': {
      get: {
        tags: ['Profiles'],
        summary: 'Get chef statistics',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Chef stats (followers, recipes, etc.)' } },
      },
    },
    '/profiles/me/details': {
      get: {
        tags: ['Profiles'],
        summary: 'Get own profile details',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Current user profile' } },
      },
    },
    '/profiles/me': {
      put: {
        tags: ['Profiles'],
        summary: 'Update own profile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bio: { type: 'string', maxLength: 500 },
                  specialties: { type: 'array', items: { type: 'string' } },
                  location: { type: 'string' },
                  socialLinks: { type: 'object' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profile updated' } },
      },
    },
    '/profiles/me/image': {
      post: {
        tags: ['Profiles'],
        summary: 'Upload profile image',
        description: 'Streams image to Cloudinary via in-memory buffer (no disk write).',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } },
        },
        responses: { 200: { description: 'Cloudinary URL stored in profile' } },
      },
    },
    '/profiles/me/banner': {
      post: {
        tags: ['Profiles'],
        summary: 'Upload banner image',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { banner: { type: 'string', format: 'binary' } } } } },
        },
        responses: { 200: { description: 'Banner image uploaded' } },
      },
    },

    // ═════════════════════════════════════════════════════════
    // SOCIAL
    // ═════════════════════════════════════════════════════════
    '/social/{recipeId}/like': {
      post: {
        tags: ['Social'],
        summary: 'Like a recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Recipe liked, count returned' }, 409: { description: 'Already liked (compound unique index)' } },
      },
      delete: {
        tags: ['Social'],
        summary: 'Unlike a recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Like removed' }, 404: { description: 'Not liked' } },
      },
    },
    '/social/{recipeId}/liked': {
      get: {
        tags: ['Social'],
        summary: 'Check if current user liked a recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Boolean liked status' } },
      },
    },
    '/social/{recipeId}/save': {
      post: {
        tags: ['Social'],
        summary: 'Save a recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Recipe saved' } },
      },
      delete: {
        tags: ['Social'],
        summary: 'Unsave a recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Recipe unsaved' } },
      },
    },
    '/social/{recipeId}/saved': {
      get: {
        tags: ['Social'],
        summary: 'Check if current user saved a recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Boolean saved status' } },
      },
    },
    '/social/{recipeId}/comments': {
      post: {
        tags: ['Social'],
        summary: 'Add a star-rated comment',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'rating'],
                properties: {
                  text: { type: 'string', maxLength: 500 },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Comment added with star rating' } },
      },
      get: {
        tags: ['Social'],
        summary: 'Get recipe comments (paginated)',
        parameters: [
          { name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Paginated comments' } },
      },
    },
    '/social/comments/{commentId}': {
      delete: {
        tags: ['Social'],
        summary: 'Delete a comment (owner or recipe chef)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Comment deleted' } },
      },
    },
    '/social/users/{userId}/follow': {
      post: {
        tags: ['Social'],
        summary: 'Follow a chef',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User followed, counts updated' }, 409: { description: 'Already following' } },
      },
      delete: {
        tags: ['Social'],
        summary: 'Unfollow a chef',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Unfollowed' } },
      },
    },
    '/social/users/{userId}/is-following': {
      get: {
        tags: ['Social'],
        summary: 'Check if current user follows a chef',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Boolean following status' } },
      },
    },
    '/social/users/{userId}/followers': {
      get: {
        tags: ['Social'],
        summary: 'Get followers of a user',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Follower list' } },
      },
    },
    '/social/users/{userId}/following': {
      get: {
        tags: ['Social'],
        summary: 'Get users a user follows',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Following list' } },
      },
    },
    '/social/users/me/saves': {
      get: {
        tags: ['Social'],
        summary: 'Get own saved recipes',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Saved recipe list' } },
      },
    },

    // ═════════════════════════════════════════════════════════
    // SEARCH
    // ═════════════════════════════════════════════════════════
    '/search/recipes': {
      get: {
        tags: ['Search'],
        summary: 'Search recipes with multi-dimensional filters',
        description: 'Supports keyword search (title, description, tags) and filtering by cuisine, difficulty, and meal type. Client uses 300ms Lodash debounce.',
        parameters: [
          { name: 'q', in: 'query', description: 'Keyword search', schema: { type: 'string' } },
          { name: 'cuisine', in: 'query', schema: { type: 'string', enum: ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'French', 'American', 'Mediterranean', 'Thai', 'Nepali', 'Other'] } },
          { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] } },
          { name: 'mealType', in: 'query', schema: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Matching recipes' } },
      },
    },
    '/search/chefs': {
      get: {
        tags: ['Search'],
        summary: 'Search chefs',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'featured', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Chef list with follow status' } },
      },
    },
    '/search/trending/recipes': {
      get: {
        tags: ['Search'],
        summary: 'Get trending recipes (by views + likes)',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 8 } }],
        responses: { 200: { description: 'Trending recipe list' } },
      },
    },
    '/search/trending/chefs': {
      get: {
        tags: ['Search'],
        summary: 'Get featured/trending chefs',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 4 } }],
        responses: { 200: { description: 'Featured chef list' } },
      },
    },
    '/search/tags': {
      get: {
        tags: ['Search'],
        summary: 'Get trending recipe tags',
        responses: { 200: { description: 'Array of tag strings' } },
      },
    },

    // ═════════════════════════════════════════════════════════
    // CHAT
    // ═════════════════════════════════════════════════════════
    '/chat/conversations': {
      get: {
        tags: ['Chat'],
        summary: 'List all conversations',
        description: 'Returns conversations sorted by lastMessage time with unread counts.',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Conversation list' } },
      },
    },
    '/chat/conversations/{userId}': {
      post: {
        tags: ['Chat'],
        summary: 'Get or create conversation with a user',
        description: 'If a conversation between the two users already exists, it is returned. Otherwise a new one is created.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'Target user to chat with' }],
        responses: {
          200: { description: 'Conversation object', content: { 'application/json': { schema: { $ref: '#/components/schemas/Conversation' } } } },
          400: { description: 'Cannot chat with yourself' },
        },
      },
    },
    '/chat/conversations/{conversationId}/messages': {
      get: {
        tags: ['Chat'],
        summary: 'Get paginated message history',
        description: 'Cursor-based pagination. Messages include status ticks (sent/delivered/seen).',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 30, maximum: 100 } },
          { name: 'before', in: 'query', description: 'Cursor: message _id to paginate before', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Message list with status ticks', content: { 'application/json': { schema: { type: 'object', properties: { messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } }, nextCursor: { type: 'string' } } } } } },
        },
      },
    },

    // ═════════════════════════════════════════════════════════
    // ANALYTICS
    // ═════════════════════════════════════════════════════════
    '/analytics/chef/recipes': {
      get: {
        tags: ['Analytics'],
        summary: 'Chef recipe performance stats',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Per-recipe views, likes, saves, comments' }, 403: { description: 'Not a chef' } },
      },
    },
    '/analytics/chef/engagement': {
      get: {
        tags: ['Analytics'],
        summary: '7-day engagement timeline + activity feeds',
        description: 'Returns total metrics, 7-day timeline (likes/views/saves per day via Promise.all), top recipes, recent likes/saves/comments feeds, and follower counts.',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Full engagement analytics with Recharts-ready timeline data' } },
      },
    },
    '/analytics/chef/followers': {
      get: {
        tags: ['Analytics'],
        summary: 'Chef follower list and count',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Follower list with follow dates' } },
      },
    },
    '/analytics/recipe/{recipeId}/views': {
      get: {
        tags: ['Analytics'],
        summary: 'Get view count for a specific recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Total views count' } },
      },
    },
    '/analytics/recipe/{recipeId}/engagement': {
      get: {
        tags: ['Analytics'],
        summary: 'Get full engagement breakdown for a recipe',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Likes, saves, comments, views, likedBy, savedBy' } },
      },
    },
    '/analytics/user/activity': {
      get: {
        tags: ['Analytics'],
        summary: 'Get own activity stats (likes given, saves, comments, following)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User activity summary' } },
      },
    },

    // ═════════════════════════════════════════════════════════
    // ADMIN
    // ═════════════════════════════════════════════════════════
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users (searchable, filterable)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['user', 'chef', 'admin'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'suspended'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: { 200: { description: 'Paginated user list' }, 403: { description: 'Not an admin' } },
      },
    },
    '/admin/users/{userId}': {
      get: {
        tags: ['Admin'],
        summary: 'Get user by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User details' } },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete user account',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User deleted' } },
      },
    },
    '/admin/users/{userId}/suspend': {
      post: {
        tags: ['Admin'],
        summary: 'Suspend user + create audit log',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User suspended, AuditLog created' } },
      },
    },
    '/admin/users/{userId}/activate': {
      post: {
        tags: ['Admin'],
        summary: 'Activate user + create audit log',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User activated, AuditLog created' } },
      },
    },
    '/admin/users/{userId}/featured': {
      patch: {
        tags: ['Admin'],
        summary: 'Toggle chef isFeatured flag',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Featured status toggled' } },
      },
    },
    '/admin/audit-logs': {
      get: {
        tags: ['Admin'],
        summary: 'View paginated audit trail (immutable)',
        description: 'Read-only, append-only audit log of all admin actions.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated audit logs', content: { 'application/json': { schema: { type: 'object', properties: { logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } } } } } },
        },
      },
    },
    '/admin/recipes/pending': {
      get: {
        tags: ['Admin'],
        summary: 'View recipe moderation queue',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Pending recipes list' } },
      },
    },
    '/admin/recipes/{recipeId}/approve': {
      post: {
        tags: ['Admin'],
        summary: 'Approve recipe → published + audit log',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Recipe published' } },
      },
    },
    '/admin/recipes/{recipeId}/reject': {
      post: {
        tags: ['Admin'],
        summary: 'Reject recipe with reason + audit log',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Recipe rejected with reason' } },
      },
    },
    '/admin/recipes/{recipeId}/flag': {
      post: {
        tags: ['Admin'],
        summary: 'Flag recipe for review',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'recipeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Recipe flagged' } },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Platform overview statistics',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Aggregate platform metrics (users, recipes, engagement)' } },
      },
    },
    '/admin/stats/users': {
      get: {
        tags: ['Admin'],
        summary: 'User statistics breakdown',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User count by role and status' } },
      },
    },
    '/admin/stats/recipes': {
      get: {
        tags: ['Admin'],
        summary: 'Recipe statistics breakdown',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Recipe count by status and cuisine' } },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [], // We define paths inline above
});

module.exports = { swaggerSpec };
