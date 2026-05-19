// Override DATABASE_URL before any module is imported so Prisma connects to the
// dev DB (port 5433, host-mapped) rather than the prod container (port 5432).
process.env.DATABASE_URL =
  'postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet?schema=public';
