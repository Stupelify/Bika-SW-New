// Default to dev DB when DATABASE_URL is not set (local runs). CI sets DATABASE_URL explicitly.
process.env.DATABASE_URL ??=
  'postgresql://postgres:secure_password_change_me@localhost:5433/bika_banquet?schema=public';
