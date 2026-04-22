# RecipeNest Backend (JavaScript)

A social media platform backend for chefs — built with **pure Node.js / Express / Mongoose**. No TypeScript, no compilation step.

## Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express 5
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Zod
- **File Uploads**: Multer + Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, express-mongo-sanitize, xss-clean, express-rate-limit

## Project Structure

```
src/
├── app.js                  # Express app factory
├── server.js               # Entry point
├── config/
│   ├── config.js           # Environment config
│   ├── cloudinary.js       # Cloudinary client
│   ├── database.js         # MongoDB connection
│   └── nodemailer.js       # Email transporter
├── constants/
│   └── index.js            # App-wide constants & enums
├── controllers/
│   ├── auth.controller.js
│   ├── profile.controller.js
│   ├── recipe.controller.js
│   └── social.controller.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── ratelimit.middleware.js
│   ├── security.middleware.js
│   ├── upload.middleware.js
│   └── validation.middleware.js
├── models/
│   ├── auditlog.model.js
│   ├── profile.model.js
│   ├── recipe.model.js
│   ├── social.model.js
│   └── user.model.js
├── routes/
│   ├── admin.routes.js
│   ├── analytics.routes.js
│   ├── auth.routes.js
│   ├── profile.routes.js
│   ├── recipe.routes.js
│   ├── search.routes.js
│   └── social.routes.js
├── services/
│   ├── audit.service.js
│   ├── cloudinary.service.js
│   └── email.service.js
├── utils/
│   ├── helpers.js
│   └── response.js
└── validators/
    └── index.js
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run in development

```bash
npm run dev
```

### 4. Run in production

```bash
npm start
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register user | — |
| POST | `/api/auth/login` | Login | — |
| POST | `/api/auth/forgot-password` | Request password reset | — |
| POST | `/api/auth/reset-password` | Reset password | — |
| POST | `/api/auth/verify-email` | Verify email | — |
| GET | `/api/auth/me` | Current user | ✅ |
| GET | `/api/recipes` | List recipes | Optional |
| POST | `/api/recipes` | Create recipe | Chef |
| GET | `/api/recipes/:id` | Get recipe | Optional |
| PUT | `/api/recipes/:id` | Update recipe | Chef |
| DELETE | `/api/recipes/:id` | Delete recipe | Chef |
| POST | `/api/recipes/:id/publish` | Publish recipe | Chef |
| GET | `/api/profiles` | List profiles | Optional |
| GET | `/api/profiles/:userId` | Get profile | Optional |
| PUT | `/api/profiles/me` | Update profile | ✅ |
| POST | `/api/profiles/me/image` | Upload avatar | ✅ |
| POST | `/api/profiles/me/banner` | Upload banner | ✅ |
| POST | `/api/social/:recipeId/like` | Like recipe | ✅ |
| DELETE | `/api/social/:recipeId/like` | Unlike recipe | ✅ |
| POST | `/api/social/:recipeId/comments` | Add comment | ✅ |
| GET | `/api/social/:recipeId/comments` | Get comments | Optional |
| POST | `/api/social/:recipeId/save` | Save recipe | ✅ |
| POST | `/api/social/users/:userId/follow` | Follow chef | ✅ |
| DELETE | `/api/social/users/:userId/follow` | Unfollow | ✅ |
| GET | `/api/admin/*` | Admin panel | Admin |
