# 🍳 RecipeNest

**RecipeNest** is a modern, full-stack recipe sharing platform designed for food enthusiasts and professional chefs. Discover, create, and manage your favorite culinary masterpieces with ease.

![RecipeNest banner](https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-40.3.0&auto=format&fit=crop&w=1200&q=80)

## ✨ Features

- **Discover**: Browse a rich collection of recipes with advanced search and filtering.
- **Chef Portal**: Specialized dashboard for chefs to manage their creations.
- **Admin Dashboard**: Comprehensive management tools for platform administrators.
- **Interactive Design**: Modern, responsive UI built with Tailwind CSS and React.
- **Media Support**: High-quality image uploads for every recipe.

## 🚀 Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Cloud Storage**: Cloudinary (Media management)
- **Auth**: JWT (JSON Web Tokens)

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Cloudinary account credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd recipenest
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Add your environment variables in .env
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 📂 Project Structure

```text
recipenest/
├── client/           # React Frontend (Vite)
│   ├── src/          # Source files
│   └── public/       # Static assets
├── server/           # Node/Express Backend
│   ├── src/          # Source files
│   └── config/       # Databases & Third-party config
└── README.md         # Project documentation
```

---

