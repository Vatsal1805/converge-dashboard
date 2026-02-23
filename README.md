# ConvergeOS - Team Management & Workflow System

**Version 2.0** | Built for Converge Digitals

A comprehensive role-based team management system for managing projects, tasks, interns, and performance tracking.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your configuration
# Make sure MongoDB is running
```

### 3. Seed Database

```bash
# Create founder account and sample data
npm run seed

# Or create only founder account
npm run seed:founder
```

**Default Credentials**:

- Email: `founder@gmail.com`
- Password: `convergedigitals`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the founder credentials.

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

## 🚢 Deployment

### Environment Variables (Production)

Make sure to set these in your production environment:

```env
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas connection
JWT_SECRET=<strong-random-secret>
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

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
