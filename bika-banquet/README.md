# 🏛️ Bika Banquet Management System

Complete full-stack banquet operations platform for managing events, customers, bookings, and payments.

## ✨ Features

### 🎯 Core Functionality

- **Customer Management**: Complete CRM with OTP verification, referral tracking
- **Enquiry System**: Track leads with pencil booking and quotation management
- **Booking Management**: 
  - Multi-pack menu system with meal slots
  - Version control for booking modifications
  - Hall allocation and pricing
  - Payment tracking and balance management
- **Venue Management**: Banquet and hall administration with capacity tracking
- **Menu Catalog**: Item types, items, and template menus
- **Payment Processing**: Multiple payment methods, installment tracking
- **Analytics Dashboard**: Revenue, bookings, hall performance insights
- **Role-Based Access Control**: Granular permissions system
- **PDF Generation**: Quotations and invoices
- **Email Notifications**: Automated communication

### 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based permissions
- Session management
- Rate limiting
- Input validation with Zod
- SQL injection protection (Prisma)

### 🚀 Technical Stack

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Winston (logging)
- PDFKit (document generation)
- Nodemailer (email)

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios
- React Hook Form + Zod validation

**DevOps:**
- Docker & Docker Compose
- Nginx reverse proxy
- Let's Encrypt SSL
- Multi-stage builds
- Health checks

## 📁 Project Structure

```
bika-banquet/
├── server/                 # Backend API
│   ├── prisma/            # Database schema & migrations
│   ├── src/
│   │   ├── config/        # Database & app config
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Helpers (JWT, logger, etc.)
│   │   └── server.ts      # Entry point
│   ├── Dockerfile
│   └── package.json
├── client/                # Frontend dashboard
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # Reusable components
│   │   ├── lib/          # API client, utilities
│   │   └── store/        # State management
│   ├── Dockerfile
│   └── package.json
├── docker/               # Nginx & deployment configs
│   ├── nginx/
│   └── certbot/
├── docker-compose.yml
├── .env.example
├── DEPLOYMENT.md
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd bika-banquet
```

2. **Set up environment variables**
```bash
# Root
cp .env.example .env

# Server
cp server/.env.example server/.env

# Edit files with your settings
```

3. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

4. **Set up database**
```bash
cd server

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run seed
```

5. **Start development servers**
```bash
# From root directory
npm run dev

# Or start individually:
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Login: admin@bikabanquet.com / admin123

### Hot Reload Development

Use this when you want changes to go live immediately without rebuilding Docker images.

1. Start a dedicated local Postgres container on `localhost:5433`
```bash
npm run dev:db
```

2. Create local-only env files
```bash
cp server/.env.local.example server/.env.local
cp client/.env.local.example client/.env.local
```

3. Start watched frontend + backend processes
```bash
npm run dev
```

What you get:
- frontend hot reload at `http://localhost:3000`
- backend auto-restart at `http://localhost:5001/api`
- separate dev database on `localhost:5433`

Useful helpers:
```bash
# stop the dev database
npm run dev:db:down

# watch only the dev database logs
npm run dev:db:logs

# one command to start db + watched app processes
npm run dev:with-db
```

Notes:
- this dev setup does not touch the running production-style Docker stack
- `server/.env.local` is loaded by the backend dev process
- `client/.env.local` is loaded automatically by Next.js dev mode
- changes to Prisma schema still need the usual Prisma generate/migrate flow

## 🐳 Docker Development

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access: http://localhost (https://localhost for TLS)

### Optional Ops Stack

The repository includes optional operational tooling:

- **Metabase** for BI/reporting dashboards
- **Uptime Kuma** for uptime and API monitoring

Start them only when needed:

```bash
docker-compose --profile ops up -d metabase uptime-kuma
```

Default local access:

- Metabase: `http://localhost:3001`
- Uptime Kuma: `http://localhost:3002`

Recommended setup after first launch:

1. In **Metabase**, add the application PostgreSQL database as a data source using:
   - Host: `db`
   - Port: `5432`
   - Database: value of `DB_NAME`
   - Username: value of `DB_USER`
   - Password: value of `DB_PASSWORD`
2. In **Uptime Kuma**, create monitors for:
   - Frontend: `http://client:3000`
   - Backend health: `http://server:5000/api/health`
   - External site: your public domain over HTTPS

These services share the same Docker network as the banquet stack, so they can reach `db`, `server`, and `client` directly.

## 📚 API Documentation

### Authentication

```bash
# Login
POST /api/auth/login
{
  "email": "admin@bikabanquet.com",
  "password": "admin123"
}

# Get current user
GET /api/auth/me
Authorization: Bearer <token>
```

### Customers

```bash
# List customers
GET /api/customers?page=1&limit=20&search=john

# Get customer
GET /api/customers/:id

# Create customer
POST /api/customers
{
  "name": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com"
}

# Update customer
PUT /api/customers/:id

# Delete customer
DELETE /api/customers/:id
```

### Bookings

```bash
# List bookings
GET /api/bookings?page=1&status=confirmed

# Get booking
GET /api/bookings/:id

# Create booking
POST /api/bookings
{
  "customerId": "uuid",
  "functionName": "Wedding Reception",
  "functionType": "Wedding",
  "functionDate": "2024-12-25",
  "functionTime": "19:00",
  "expectedGuests": 500,
  "halls": [...],
  "packs": [...]
}

# Cancel booking
POST /api/bookings/:id/cancel

# Add payment
POST /api/bookings/:id/payments
{
  "amount": 50000,
  "method": "upi",
  "narration": "Advance payment"
}
```

## 🎨 Frontend Features

### Dashboard
- Revenue overview
- Recent bookings
- Upcoming events
- Customer statistics

### Customer Management
- Search and filter
- Complete profile management
- Booking history
- Referral tracking

### Booking System
- Step-by-step booking creation
- Hall availability checking
- Multi-pack menu selection
- Payment tracking
- Version history

### Reports
- Revenue analytics
- Hall utilization
- Function trends
- Payment status

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bika_banquet
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Client**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Database Schema

Key models:
- **User**: Authentication and roles
- **Customer**: Client database
- **Enquiry**: Lead tracking
- **Booking**: Event bookings
- **BookingPack**: Menu packages per booking
- **Hall**: Venue management
- **Item**: Menu items
- **Payment**: Transaction tracking

See `server/prisma/schema.prisma` for complete schema.

## 🚀 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete VPS deployment guide.

Quick checklist:
- [ ] Set up VPS with Ubuntu
- [ ] Install Docker & Docker Compose
- [ ] Configure domain DNS
- [ ] Clone application
- [ ] Set environment variables
- [ ] Deploy with Docker Compose
- [ ] Obtain SSL certificate
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Change default credentials
- [ ] Set up backups

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd server && npm test

# Frontend tests (when implemented)
cd client && npm test
```

## 📈 Monitoring

### Health Checks
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000

### Logs
```bash
# Docker logs
docker-compose logs -f

# Server logs (in development)
tail -f server/logs/combined.log
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🙋 Support

For issues and questions:
- Check documentation
- Review logs
- Contact support team

## 🎯 Roadmap

### Planned Features
- [ ] WhatsApp integration for notifications
- [ ] Advanced reporting with exports
- [ ] Inventory management
- [ ] Vendor management
- [ ] Multi-location support
- [ ] Mobile app
- [ ] Online booking portal
- [ ] Integration with payment gateways

## 👥 Team

Built with ❤️ for efficient banquet operations management.

---

**Version:** 1.0.0  
**Last Updated:** 2024
