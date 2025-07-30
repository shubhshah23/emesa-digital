@echo off
echo 🚀 Starting Emesa application...

REM Stop any existing containers
echo 📦 Stopping existing containers...
docker-compose down

REM Remove old volumes to ensure clean start
echo 🧹 Cleaning up old volumes...
docker volume rm emesa_emesa_frontend_dist 2>nul

REM Start database first
echo 🗄️ Starting database...
docker-compose up -d db

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 30 /nobreak >nul

REM Start backend
echo 🔧 Starting backend...
docker-compose up -d backend

REM Wait for backend to be ready
echo ⏳ Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

REM Start frontend
echo ⚛️ Starting frontend...
docker-compose up -d frontend

REM Wait for frontend to build
echo ⏳ Waiting for frontend to build...
timeout /t 60 /nobreak >nul

REM Start nginx
echo 🌐 Starting nginx...
docker-compose up -d nginx

REM Wait for nginx to be ready
echo ⏳ Waiting for nginx to be ready...
timeout /t 5 /nobreak >nul

REM Check status
echo 📊 Checking service status...
docker-compose ps

echo ✅ Emesa application started successfully!
echo 🌍 Frontend available at: http://localhost:8080
echo 🔌 API available at: http://localhost:8080/api/
echo 🗄️ Database available at: localhost:3307

REM Show logs for debugging
echo 📋 Recent logs:
docker-compose logs --tail=10

pause 