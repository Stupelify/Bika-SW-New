#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting server..."
exec node_modules/.bin/pm2-runtime dist/server.js -i max
