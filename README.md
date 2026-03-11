# ConvergeOS - Project Management Dashboard

A comprehensive project management system built with Next.js 14, TypeScript, MongoDB, and Tailwind CSS. Features role-based access control for Founders, Team Leads, and Interns.

## 🚀 Features

- **Role-Based Dashboards**: Separate dashboards for Founders, Team Leads, and Interns
- **Project Management**: Create, assign, and track projects with multiple team leads
- **Task Management**: Assign tasks to interns with priority levels and deadlines
- **Performance Tracking**: Review and track intern performance with metrics
- **CRM & Leads**: Manage leads with deal values and conversion tracking
- **Research Vault**: Store and organize research files and documentation
- **Real-time Notifications**: In-app notifications for project assignments
- **Authentication & Authorization**: JWT-based secure authentication

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: JWT tokens with httpOnly cookies

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- npm or yarn package manager

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Vatsal1805/converge-dashboard.git
cd converge-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_secure_random_secret
```

### 4. Seed the database

```bash
npm run seed
```

### 5. Start development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation

- **[SCALABILITY_GUIDE.md](./SCALABILITY_GUIDE.md)** - Complete scalability and optimization guide
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step integration guide for new features

---

## 🎯 Features

### Role-Based Access Control

- **Founder**: Full system access, user management, revenue tracking
- **Team Lead**: Project management, task assignment, team performance
- **Intern**: Task execution, progress tracking, performance view

### Core Modules

- ✅ **Projects** - Client projects with team assignments
- ✅ **Tasks** - Task management with status tracking
- ✅ **CRM/Leads** - Lead tracking and conversion pipeline
- ✅ **Performance** - Intern performance reviews and metrics
- ✅ **Research Vault** - Document repository with approval workflow
- ✅ **Brainstorm** - Team collaboration and idea sharing

### New Scalability Features (v2.0)

- ⚡ **Caching Layer** - In-memory caching for faster responses
- 🛡️ **Rate Limiting** - API protection against abuse
- 📧 **Notifications** - Email notifications for important events
- 📝 **Audit Trail** - Complete activity logging for accountability
- ✅ **Enhanced Validation** - Centralized validation schemas
- 🚨 **Error Handling** - Consistent error responses and logging
- 💾 **Backup System** - Automated database backup utilities

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run seed         # Seed database with founder + sample data
npm run seed:founder # Create only founder account

# Backup & Recovery
npm run backup       # Create database backup
npm run backup:list  # List all backups
npm run backup:clean # Clean old backups (keep last 10)
```

---

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Jose)
- **UI**: React 19, Tailwind CSS, Shadcn/ui
- **Validation**: Zod
- **Forms**: React Hook Form

---

## 📁 Project Structure

```
converge-flow-main/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Role-based dashboards
│   │   └── (app)/        # Protected routes
│   ├── components/       # Reusable components
│   ├── lib/              # Utilities and helpers
│   │   ├── auth.ts       # Authentication
│   │   ├── db.ts         # Database connection
│   │   ├── cache.ts      # Caching layer ⚡ NEW
│   │   ├── rateLimit.ts  # Rate limiting 🛡️ NEW
│   │   ├── validation.ts # Validation schemas ✅ NEW
│   │   ├── errors.ts     # Error handling 🚨 NEW
│   │   ├── notifications.ts # Email notifications 📧 NEW
│   │   └── audit.ts      # Audit logging 📝 NEW
│   └── models/           # Mongoose schemas
├── scripts/
│   ├── seed.js           # Database seeding
│   └── backup.js         # Backup utility 💾 NEW
├── .env.local            # Environment configuration
└── SCALABILITY_GUIDE.md  # Complete documentation 📚 NEW
```

---

## 🔐 Security

- JWT-based authentication
- bcrypt password hashing
- Role-based access control (RBAC)
- Input validation on all endpoints
- Rate limiting on API routes
- Secure HTTP headers

---

## 📊 Performance Optimizations

- Database connection pooling
- Query optimization with indexes
- Pagination on list endpoints
- Mongoose `.lean()` for read operations
- Client-side caching (localStorage)
- Server-side caching layer
- Response compression

---

## 🚢 Deployment on Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Vatsal1805/converge-dashboard.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `converge-dashboard` repository
4. In the "Configure Project" step, add these environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/convergeos?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_secret_here
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

**Generate a secure JWT_SECRET:**

```bash
openssl rand -base64 32
```

5. Click "Deploy"

### Step 3: Post-Deployment Setup

After your first deployment, seed your production database:

```bash
# Set your production MONGODB_URI temporarily
export MONGODB_URI="your_production_mongodb_uri"
npm run seed
```

Or use a MongoDB client to import seed data directly.

### MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with password
3. Whitelist Vercel IP (`0.0.0.0/0` for all IPs)
4. Get your connection string and add it to Vercel environment variables

---

## 🔑 Default Credentials

After seeding the database, use these credentials:

**Founder Account:**

- Email: `founder@convergedigitals.com`
- Password: `founder123`

**Team Lead Account:**

- Email: `rajesh@convergedigitals.com`
- Password: `teamlead123`

**Intern Account:**

- Email: `intern@gmail.com`
- Password: `intern123`

**⚠️ IMPORTANT**: Change all default passwords immediately after first login in production!

---

## 📊 Environment Variables Reference

| Variable              | Description               | Required | Example                  |
| --------------------- | ------------------------- | -------- | ------------------------ |
| `MONGODB_URI`         | MongoDB connection string | ✅ Yes   | `mongodb+srv://...`      |
| `JWT_SECRET`          | Secret for JWT signing    | ✅ Yes   | `random_32_char_string`  |
| `NEXT_PUBLIC_APP_URL` | Your app URL              | ✅ Yes   | `https://app.vercel.app` |
| `JWT_EXPIRES_IN`      | Token expiration          | No       | `7d` (default)           |
| `NODE_ENV`            | Environment mode          | No       | `production`             |
| `LOG_LEVEL`           | Logging level             | No       | `info` (default)         |

---

## 🐛 Troubleshooting

### Database Connection Error

- Verify `MONGODB_URI` is correctly set
- For MongoDB Atlas, ensure IP `0.0.0.0/0` is whitelisted
- Check if database user has proper permissions

### Authentication Issues

- Clear browser cookies and try again
- Verify `JWT_SECRET` is set in environment variables
- Check if token hasn't expired

### Build Errors on Vercel

- Ensure all dependencies are in `package.json`
- Check that TypeScript types are correct
- Verify environment variables are set in Vercel dashboard

### 429 Rate Limit Error

- Rate limiting is per-endpoint (not global)
- Wait 15 minutes or temporarily disable in development
- In production, rate limits protect against abuse

---

## 🔐 Security Best Practices

- ✅ All sensitive data in environment variables (never hardcoded)
- ✅ `.env.local` is gitignored
- ✅ Rate limiting enabled on all API routes
- ✅ JWT tokens stored in httpOnly cookies
- ✅ Passwords hashed with bcrypt
- ✅ Input validation with Zod schemas
- ✅ Role-based access control enforced

---

## 📧 Support

For issues or questions:

- Create an issue on GitHub
- Email: support@convergedigitals.com

---

## 📄 License

Proprietary and confidential. © 2026 Converge Digitals

---

**Built with ❤️ by Converge Digitals**
NODE_ENV=production

````

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
````

---

## 📞 Support

For questions or issues:

1. Check [SCALABILITY_GUIDE.md](./SCALABILITY_GUIDE.md) for detailed documentation
2. Review [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for integration help
3. Contact the development team

---

## 📝 License

Private - Converge Digitals Internal Use Only

---

**Built with ❤️ by Converge Digitals**
