# 🚀 Bika Banquet - Complete Setup Instructions

## 📦 What You Have

A complete, production-ready full-stack banquet management system with:

✅ **Backend API** (Express + TypeScript + Prisma)
✅ **Frontend Dashboard** (Next.js 14 + TypeScript + Tailwind)
✅ **Database Schema** (PostgreSQL with Prisma)
✅ **Authentication & RBAC** (JWT with role-based permissions)
✅ **Docker Configuration** (Full production deployment setup)
✅ **Nginx + SSL** (Reverse proxy with Let's Encrypt)

## 🎯 Quick Start Options

### Option 1: Docker (Recommended for Production)

**Prerequisites:** Docker & Docker Compose installed

```bash
cd bika-banquet

# 1. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 2. Run quick start script
chmod +x start.sh
./start.sh

# 3. Access application
# Frontend: http://localhost
# Login: admin@bikabanquet.com / admin123
```

### Option 2: Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 16+

```bash
cd bika-banquet

# 1. Setup environment files
cp .env.example .env
cp server/.env.example server/.env
# Edit both files with your settings

# 2. Install dependencies
npm install
cd server && npm install
cd ../client && npm install

# 3. Setup database
cd server
npm run prisma:generate
npm run prisma:migrate
npm run seed

# 4. Start development servers
cd ..
npm run dev

# 5. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 📋 Environment Configuration

### Critical Settings to Change

**In root .env:**
```env
# MUST CHANGE - Security
DB_PASSWORD=create_secure_password_here
JWT_SECRET=create_32_plus_character_secret_here

# MUST CHANGE - Your domain
CLIENT_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# MUST CHANGE - Email settings
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### Gmail App Password Setup
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Generate App Password
4. Use that password in SMTP_PASS

## 🎨 Application Features

### ✅ Implemented & Working

1. **Authentication System**
   - JWT-based login/logout
   - Session management
   - Password hashing
   - Role-based access control

2. **Customer Management**
   - CRUD operations
   - Search and pagination
   - OTP verification
   - Referral tracking
   - Customer history

3. **Booking System**
   - Create bookings with multiple packs
   - Hall allocation
   - Menu selection
   - Payment tracking
   - Version control
   - Quotation vs confirmed bookings

4. **Dashboard**
   - Statistics overview
   - Recent bookings
   - Revenue tracking

5. **Database**
   - Complete schema for all features
   - Relationships and constraints
   - Migrations ready

6. **API Endpoints**
   - RESTful structure
   - Input validation (Zod)
   - Error handling
   - Rate limiting

### 🔨 To Be Completed (Easy Extensions)

1. **Additional Pages:**
   - Halls management page
   - Menu items page
   - Reports/analytics
   - Settings page
   - User management

2. **Features:**
   - PDF generation (libraries installed)
   - Email sending (configured)
   - File uploads
   - Advanced filters

3. **Enhancements:**
   - Real-time notifications
   - Bulk operations
   - Export functionality

## 📁 Project Structure

```
bika-banquet/
├── server/                     # Backend API
│   ├── src/
│   │   ├── config/            # Database config
│   │   ├── controllers/       # Business logic
│   │   │   ├── auth.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   └── booking.controller.ts
│   │   ├── middleware/        # Auth, validation, errors
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Helpers
│   │   └── server.ts          # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── package.json
│
├── client/                     # Frontend
│   ├── src/
│   │   ├── app/               # Next.js pages
│   │   │   ├── dashboard/    # Main app pages
│   │   │   └── login/        # Auth pages
│   │   ├── components/        # Reusable UI
│   │   ├── lib/               # API client
│   │   └── store/             # State management
│   └── package.json
│
├── docker/                     # Deployment
│   └── nginx/                 # Web server config
│
├── docker-compose.yml         # Multi-container setup
├── start.sh                   # Quick start script
├── README.md                  # Documentation
├── DEPLOYMENT.md              # Production guide
└── .env.example               # Config template
```

## 🔐 Security Checklist

Before going live:
- [ ] Change default admin password
- [ ] Set strong DB_PASSWORD (16+ chars)
- [ ] Set secure JWT_SECRET (32+ chars)
- [ ] Configure SMTP properly
- [ ] Enable SSL/HTTPS
- [ ] Set up firewall rules
- [ ] Regular database backups
- [ ] Monitor logs
- [ ] Update dependencies regularly

## 🚀 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step VPS deployment guide.

**Summary:**
1. Get VPS (Ubuntu 20.04+, 2GB RAM minimum)
2. Point domain to VPS IP
3. Install Docker & Docker Compose
4. Upload application files
5. Configure .env with production settings
6. Run start.sh script
7. Get SSL certificate
8. Access your application!

## 🆘 Troubleshooting

### Backend won't start
```bash
docker-compose logs server
# Check DATABASE_URL is correct
# Ensure PostgreSQL is running
```

### Frontend shows API errors
```bash
# Check NEXT_PUBLIC_API_URL in .env
# Ensure backend is running
# Check CORS settings in server
```

### Database connection failed
```bash
# Verify DATABASE_URL format
# Check PostgreSQL is accessible
docker-compose ps
```

### Can't login
```bash
# Reset admin password
docker exec -it bika-server sh
npm run seed  # Re-seed database
```

## 📖 API Examples

### Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bikabanquet.com","password":"admin123"}'

# Get current user
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Customers
```bash
# List customers
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create customer
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com"
  }'
```

## 🎓 Next Steps

1. **Initial Setup:**
   - Deploy application
   - Login with default credentials
   - Change admin password
   - Configure email settings

2. **Add Your Data:**
   - Create halls and banquets
   - Add menu items and templates
   - Set up meal slots
   - Create user accounts for staff

3. **Customize:**
   - Update branding colors in Tailwind config
   - Modify email templates
   - Add custom fields if needed

4. **Train Team:**
   - Customer management workflow
   - Enquiry to booking process
   - Payment tracking
   - Report generation

## 💡 Tips

- Use **Docker** for consistent environments
- Set up **database backups** daily
- Monitor **logs** regularly
- Keep **dependencies updated**
- Test on **staging** before production
- Document **customizations**

## 📞 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review documentation
3. Verify environment variables
4. Ensure all services are healthy

## 🎉 You're Ready!

Your complete banquet management system is ready to deploy. Follow the quick start guide above and you'll be running in minutes!

**Default Credentials:**
- Email: admin@bikabanquet.com  
- Password: admin123

**⚠️ IMPORTANT: Change these immediately after first login!**

Good luck with your banquet business! 🏛️✨
