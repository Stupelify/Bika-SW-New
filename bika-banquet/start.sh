#!/bin/bash

# Bika Banquet Quick Start Script
echo "🏛️  Bika Banquet - Quick Start"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your settings before proceeding!"
    echo "   Run: nano .env"
    read -p "Press Enter after editing .env file..."
fi

echo "🔨 Building and starting services..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🗄️  Running database migrations..."
docker-compose exec -T server npx prisma migrate deploy

echo ""
echo "🌱 Seeding database with initial data..."
docker-compose exec -T server npm run seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Access points:"
echo "   - Frontend: http://localhost"
echo "   - API: http://localhost/api"
echo ""
echo "🔑 Default login credentials:"
echo "   Email: admin@bikabanquet.com"
echo "   Password: admin123"
echo ""
echo "⚠️  Important: Change the default password after first login!"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
echo ""
echo "🎉 Happy managing!"
