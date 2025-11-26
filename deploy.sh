#!/bin/bash

# Mobile Tech CRM - Quick Deployment Script for DigitalOcean Droplet

set -e

echo "🚀 Mobile Tech CRM Deployment Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    apt install -y docker-compose
fi

echo "✅ Docker installed"

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "⚠️  backend/.env not found!"
    echo "Creating template..."
    cat > backend/.env << 'EOF'
API_KEY=your_gemini_api_key_here
NODE_ENV=production
PORT=3001
EOF
    echo "📝 Please edit backend/.env and add your Gemini API key"
    exit 1
fi

# Check if serviceAccountKey.json exists
if [ ! -f "backend/serviceAccountKey.json" ]; then
    echo ""
    echo "⚠️  backend/serviceAccountKey.json not found!"
    echo "Please upload your Firebase service account key to backend/serviceAccountKey.json"
    exit 1
fi

echo "✅ Configuration files found"

# Build and start
echo ""
echo "🔨 Building Docker image..."
docker-compose build

echo ""
echo "🚀 Starting application..."
docker-compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

# Check health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo ""
    echo "✅ Application deployed successfully!"
    echo ""
    echo "📊 Status:"
    docker-compose ps
    echo ""
    echo "🌐 Access your application at:"
    echo "   http://$(curl -s ifconfig.me):3001"
    echo ""
    echo "📝 View logs with: docker-compose logs -f"
else
    echo ""
    echo "❌ Application failed to start. Check logs:"
    docker-compose logs
    exit 1
fi
