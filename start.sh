#!/bin/bash

# Startup script for Emesa application
echo "🚀 Starting Emesa application..."

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old volumes to ensure clean start
echo "🧹 Cleaning up old volumes..."
docker volume rm emesa_emesa_frontend_dist 2>/dev/null || true

# Start database first
echo "🗄️ Starting database..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Start backend
echo "🔧 Starting backend..."
docker-compose up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Start frontend
echo "⚛️ Starting frontend..."
docker-compose up -d frontend

# Wait for frontend to build
echo "⏳ Waiting for frontend to build..."
sleep 60

# Start nginx
echo "🌐 Starting nginx..."
docker-compose up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 5

# Check status
echo "📊 Checking service status..."
docker-compose ps

echo "✅ Emesa application started successfully!"
echo "🌍 Frontend available at: http://localhost:8080"
echo "🔌 API available at: http://localhost:8080/api/"
echo "🗄️ Database available at: localhost:3307"

# Show logs for debugging
echo "📋 Recent logs:"
docker-compose logs --tail=10 