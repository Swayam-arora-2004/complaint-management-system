# Complaint Management System

A comprehensive complaint management system with role-based access control, allowing users to submit complaints and administrators to manage them efficiently.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Role-Based Access](#role-based-access)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### User Features
- **User Registration & Login**: Email/password authentication with Google and Apple OAuth support
- **Password Reset**: Forgot password functionality with email verification
- **Submit Complaints**: Create complaints with attachments (images, PDFs, documents)
- **View Complaints**: Dashboard showing all user complaints with filtering and sorting
- **Complaint Details**: View detailed complaint information with comments
- **Add Comments**: Users can add comments to their complaints
- **Attachment Viewer**: View attachments in a modal dialog (images, PDFs, etc.)
- **Status Tracking**: Real-time status updates (New, In Progress, Resolved, Closed)
- **Satisfaction Confirmation**: Prompt to confirm satisfaction when complaint is resolved
- **Auto-refresh**: Automatic updates every 10 seconds for new comments and status changes

### Admin Features
- **Admin Dashboard**: View all complaints with search, filter, and sort capabilities
- **Complaint Management**: Update complaint status and add support agent comments
- **User Management**: View user information for each complaint
- **Open/Closed Sections**: Separate views for open and closed complaints
- **Attachment Access**: View and manage attachments for all complaints
- **Email Notifications**: Send email notifications on status changes

### Additional Features
- **AI Chatbot**: Interactive chatbot for user support (Groq/OpenAI integration)
- **Email Notifications**: Automated emails for complaint submissions and status updates
- **File Upload**: Support for multiple file types with secure storage
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Supabase** - OAuth integration

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (Mongoose ODM)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **CORS** - Cross-origin resource sharing

## 📦 Prerequisites

- **Node.js** (v16 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** - Package manager
- **MongoDB** - Database (local or MongoDB Atlas)
- **Gmail Account** (optional) - For email notifications

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd complaint-compass-main
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

## ⚙️ Configuration

### Frontend Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here (optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5001
FRONTEND_URL=http://localhost:8080

# MongoDB
MONGODB_URI=mongodb://localhost:27017/complaint-compass
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/complaint-compass

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL="Complaint System <your_email@gmail.com>"
```

### Setting Up Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `SMTP_PASS`

### Setting Up OAuth (Google/Apple)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Google and Apple providers in Supabase dashboard
3. Configure redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Add Supabase URL and keys to frontend `.env`

## 🏃 Running the Project

### Development Mode

#### Start Backend Server

```bash
cd server
npm run dev
```

The backend will run on `http://localhost:5001`

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:8080`

### Production Build

#### Build Frontend

```bash
npm run build
```

#### Start Backend (Production)

```bash
cd server
npm start
```

## 📁 Project Structure

```
complaint-compass-main/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── ChatBot.tsx   # AI chatbot component
│   │   ├── Header.tsx    # Navigation header
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── Auth.tsx      # Login/Register page
│   │   ├── Dashboard.tsx # User dashboard
│   │   ├── AdminDashboard.tsx # Admin dashboard
│   │   └── ...
│   ├── lib/              # Utility functions
│   │   ├── api.ts        # API service layer
│   │   ├── auth.ts       # Authentication helpers
│   │   └── complaints.ts # Complaint management
│   └── contexts/         # React contexts
│       └── AuthContext.tsx
├── server/               # Backend source code
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   │   ├── db.js    # MongoDB connection
│   │   │   └── mailer.js # Email configuration
│   │   ├── models/      # Mongoose models
│   │   │   ├── User.js
│   │   │   └── Complaint.js
│   │   ├── routes/      # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── complaintRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   └── oauthRoutes.js
│   │   ├── middleware/  # Express middleware
│   │   │   └── auth.js  # JWT authentication
│   │   └── index.js     # Server entry point
│   └── uploads/         # File uploads directory
└── public/              # Static assets
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user

### OAuth

- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/apple` - Apple OAuth login

### Complaints (User)

- `GET /api/complaints` - Get user's complaints
- `GET /api/complaints/:id` - Get complaint details
- `POST /api/complaints` - Create new complaint
- `PATCH /api/complaints/:id/status` - Update complaint status
- `POST /api/complaints/:id/comments` - Add comment
- `POST /api/complaints/:id/confirm-satisfaction` - Confirm satisfaction
- `DELETE /api/complaints/:id` - Delete complaint
- `GET /api/complaints/:id/attachments/:filename` - Get attachment

### Admin

- `GET /api/admin/complaints` - Get all complaints
- `GET /api/admin/complaints/:id` - Get any complaint
- `PATCH /api/admin/complaints/:id/status` - Update complaint status
- `POST /api/admin/complaints/:id/comments` - Add support agent comment
- `GET /api/admin/complaints/:id/attachments/:filename` - Get attachment

## 🔐 Authentication

### User Authentication

Users can authenticate using:
1. **Email/Password**: Traditional registration and login
2. **Google OAuth**: Sign in with Google account
3. **Apple OAuth**: Sign in with Apple ID

### Admin Authentication

Fixed admin credentials:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Note**: Change these credentials in production!

### JWT Tokens

- Tokens are stored in `localStorage` as `auth_token`
- Tokens expire after 7 days
- Include token in `Authorization: Bearer <token>` header for protected routes

## 👥 Role-Based Access

### User Role (`user`)
- Access: `/dashboard`, `/complaint/:id`, `/submit`
- Can: Create complaints, view own complaints, add comments
- Cannot: Access admin routes

### Admin Role (`admin` / `support_agent`)
- Access: `/admin/dashboard`, `/admin/complaint/:id`
- Can: View all complaints, update status, add support comments
- Cannot: Access user routes

### Protected Routes

Routes are protected by `ProtectedRoute` component:
- Unauthenticated users → Redirected to `/auth`
- Wrong role → Redirected to appropriate dashboard

## 🚢 Deployment

### Quick Deployment

For a step-by-step guide, see:
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Fast track deployment guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment checklist

### Recommended Setup

- **Frontend**: [Vercel](https://vercel.com) (free tier available)
- **Backend**: [Railway](https://railway.app) (free tier available)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

### Quick Steps

1. **Push to GitHub**: Commit and push your code
2. **Deploy Backend to Railway**:
   - Connect GitHub repo
   - Set root directory to `server`
   - Add environment variables
   - Deploy
3. **Deploy Frontend to Vercel**:
   - Import GitHub repo
   - Add environment variables (including Railway backend URL)
   - Deploy
4. **Update URLs**: Update `FRONTEND_URL` in Railway and `VITE_API_BASE_URL` in Vercel
5. **Test**: Verify all features work

See the deployment guides for detailed instructions.

## 🧪 Testing

### API Testing with Postman

Import the `postman_collection.json` file:
1. Open Postman
2. Import → File → Select `postman_collection.json`
3. Set environment variables:
   - `base_url`: `http://localhost:5001/api`
   - `token`: (will be set automatically after login)

### Test Scripts

```bash
# Test email configuration
cd server
node test-email.js

# Reset test user password
node reset-test-password.js
```

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`
- Check if port 5001 is available

#### Email not sending
- Verify Gmail App Password is correct
- Check SMTP settings in `.env`
- Ensure 2-Step Verification is enabled

#### Attachments not loading
- Check file uploads directory exists: `server/uploads/`
- Verify file permissions
- Check attachment URL in browser console

#### OAuth not working
- Verify Supabase credentials
- Check redirect URI matches exactly
- Ensure OAuth providers are enabled in Supabase

#### CORS errors
- Add frontend URL to backend CORS configuration
- Check `FRONTEND_URL` in backend `.env`

### Debug Mode

Enable detailed logging:
- Backend: Check console for error messages
- Frontend: Open browser DevTools (F12) → Console tab

## 📝 License

This project is private and proprietary.

## 👤 Author

Complaint Management System - Built with React, Node.js, and MongoDB

## 🤝 Contributing

This is a private project. For issues or questions, please contact the development team.

---

**Note**: Remember to change default admin credentials and JWT secret before deploying to production!

