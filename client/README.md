# RecipeNest Frontend

Production-grade React frontend for the RecipeNest platform.

## Stack

- **React 18** + Vite
- **Tailwind CSS** (custom design system)
- **Axios** with JWT interceptors + auto-logout on 401
- **React Router DOM v6** with protected/role routes
- **React Hook Form + Yup** validation
- **Zustand** (available for extended state)
- **Recharts** for analytics dashboards
- **react-hot-toast** for notifications

## Quick Start

```bash
cp .env.example .env.local
# Edit VITE_API_BASE_URL to point at your backend

npm install
npm run dev
```

App runs at **http://localhost:5173**

## Environment

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |

## Project Structure

```
src/
├── api/            # Axios instance + per-resource API modules
├── constants/      # Endpoints, roles, enums
├── components/     # Reusable UI, layout, recipe, social, profile
├── context/        # AuthContext, RoleContext
├── hooks/          # useAuth, useRecipes, useProfile
├── pages/          # Auth, Public, User, Chef, Admin
├── routes/         # AppRoutes, ProtectedRoute, RoleRoute
└── utils/          # tokenStorage, helpers, validators
```

## Roles & Access

| Role | Access |
|---|---|
| Public | Browse recipes, profiles, search |
| User | + Like, save, comment, follow |
| Chef | + Create/edit/publish recipes, analytics |
| Admin | + User management, recipe moderation, audit logs |

## Auth Flow

1. JWT stored in `localStorage` via `tokenStorage` util
2. Axios request interceptor attaches `Authorization: Bearer <token>`
3. Response interceptor catches 401 → clears token → redirects to login
4. `AuthContext` auto-fetches `/auth/me` on app load if token exists
