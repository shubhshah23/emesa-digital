# Emesa Manufacturing Platform

## 🏭 **Enterprise Manufacturing Order Management System**

Emesa is a full-stack manufacturing platform for custom component orders, featuring secure client onboarding, intelligent order management, real-time negotiation, and comprehensive admin controls.

### **🚀 Current Architecture Summary**
- **Single Entry Point**: Nginx reverse proxy on port 8080
- **Frontend**: React app (internal only, served via Nginx)
- **Backend**: Django REST API (internal only, proxied via Nginx)
- **Database**: MySQL 8.0 (accessible on port 3307)
- **Containerization**: Docker Compose with shared volumes
- **Access URL**: http://localhost:8080

---

## 📋 **Table of Contents**
- [System Overview](#system-overview)
- [Architecture & Infrastructure](#architecture--infrastructure)
- [User Workflows](#user-workflows)
- [API Documentation](#api-documentation)
- [State Management](#state-management)
- [Security & Authentication](#security--authentication)
- [Deployment Guide](#deployment-guide)
- [Development Setup](#development-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🎯 **System Overview**

### **Core Features**
- **🔐 Secure Authentication** - JWT-based auth with role-based access
- **📋 Order Management** - Complete order lifecycle from submission to completion
- **💳 Real-time Negotiation** - Built-in system for price negotiation through counter offers
- **🏭 Machine Management** - Admin control over production capacity
- **👥 Supplier Management** - Multi-supplier support with capabilities tracking
- **📊 Admin Dashboard** - Comprehensive analytics and control panel
- **📁 File Management** - STEP file upload and version control
- **💳 Future Payment Integration** - Simulated payment processing workflow

### **User Roles**
- **Client** - Submit orders, negotiate prices, track progress
- **Admin** - Manage orders, suppliers, machines, and system operations

---

## 🏗️ **Architecture & Infrastructure**

### **System Architecture Diagram**
```mermaid
graph TB
    subgraph "Client Layer"
        Browser["🌐 Web Browser"]
        Mobile["📱 Mobile Browser"]
    end
    
    subgraph "Load Balancer & Proxy"
        Nginx["🔄 Nginx Reverse Proxy<br/>Port 8080 (Host) → 80 (Container)"]
    end
    
    subgraph "Frontend Layer"
        React["⚛️ React App<br/>Vite + TypeScript<br/>Internal Only (No Host Port)"]
        UI["🎨 Shadcn/UI Components"]
        Router["🛣️ React Router"]
    end
    
    subgraph "Backend Layer"
        Django["🐍 Django REST API<br/>Internal Only (Port 8000)"]
        Gunicorn["🦄 Gunicorn WSGI"]
        Auth["🔐 JWT Authentication"]
    end
    
    subgraph "Data Layer"
        MySQL["🐬 MySQL 8.0 Database<br/>Port 3307 (Host) → 3306 (Container)"]
        Media["📁 Media Storage"]
    end
    
    subgraph "Infrastructure"
        Docker["🐳 Docker Containers"]
        Compose["📦 Docker Compose"]
        Volumes["💾 Persistent Volumes<br/>Shared Frontend Build"]
    end
    
    Browser --> Nginx
    Mobile --> Nginx
    Nginx --> React
    React --> Django
    Django --> MySQL
    Django --> Media
    Django --> Gunicorn
    Gunicorn --> Django
    
    Docker --> Compose
    Compose --> Nginx
    Compose --> React
    Compose --> Django
    Compose --> MySQL
```

### **Container Architecture**
```mermaid
graph LR
    subgraph "Docker Compose Services"
        Nginx["nginx:alpine<br/>Port 8080:80"]
        Frontend["node:20-alpine<br/>React App<br/>Internal Only"]
        Backend["python:3.11<br/>Django + Gunicorn<br/>Internal Only"]
        Database["mysql:8.0<br/>Port 3307:3306"]
    end
    
    subgraph "Shared Resources"
        Media["📁 Local Media Storage"]
        Logs["📋 Application Logs"]
        FrontendBuild["📦 Shared Frontend Build Volume"]
    end
    
    Nginx --> Frontend
    Nginx --> Backend
    Backend --> Database
    Backend --> Media
    Backend --> Logs
    Frontend --> FrontendBuild
    Nginx --> FrontendBuild
```

### **Network Flow**
```mermaid
sequenceDiagram
    participant Client
    participant Nginx
    participant Frontend
    participant Backend
    participant Database
    
    Client->>Nginx: HTTP Request (Port 8080)
    Nginx->>Frontend: Serve Built React Assets
    Nginx->>Backend: Proxy API Requests (/api/*)
    
    Note over Frontend,Backend: Frontend makes API calls to /api/
    Backend->>Database: Query Data (Port 3306)
    Database-->>Backend: Return Data
    Backend-->>Nginx: JSON Response
    Nginx-->>Client: Rendered UI + API Data
```

### **Port Configuration & Access Points**

| Service | Container Port | Host Port | Access URL | Description |
|---------|---------------|-----------|------------|-------------|
| **Nginx** | 80 | 8080 | http://localhost:8080 | Main application entry point |
| **Frontend** | 80 | ❌ None | ❌ Internal only | React app (served via Nginx) |
| **Backend** | 8000 | ❌ None | ❌ Internal only | Django API (proxied via Nginx) |
| **Database** | 3306 | 3307 | localhost:3307 | MySQL database (direct access) |

#### **Key Architecture Points:**
- **Single Entry Point**: Only Nginx (port 8080) is exposed to the host
- **Internal Communication**: Frontend and Backend communicate internally via Docker network
- **Shared Volume**: Frontend build files are shared between Frontend and Nginx containers
- **API Proxy**: All API calls (/api/*) are proxied from Nginx to Backend
- **Database Access**: MySQL is accessible on host port 3307 for development/debugging

---

## 🔄 **User Workflows**

### **Client Order Workflow**
```mermaid
flowchart TD
    A["🏠 Landing Page"] --> B["🔐 Sign Up/Login"]
    B --> C["📋 Submit Order Form"]
    C --> D["📁 Upload STEP File"]
    D --> E["💳 Enter Payment Details"]
    E --> F["📤 Submit Order"]
    F --> G["⏳ Order Under Review"]
    G --> H["💬 Negotiation Phase"]
    H --> I["🤝 Price Agreement"]
    I --> J["💳 Confirm Payment"]
    J --> K["🏭 Production Starts"]
    K --> L["✅ Order Completed"]
    
    style A fill:#e1f5fe
    style L fill:#c8e6c9
    style H fill:#fff3e0
    style J fill:#f3e5f5
```

### **Admin Management Workflow**
```mermaid
flowchart TD
    A["🔐 Admin Login"] --> B["📊 Dashboard Overview"]
    B --> C["📋 Review New Orders"]
    C --> D["💬 Negotiate with Client"]
    D --> E["🏭 Assign Machine"]
    E --> F["▶️ Start Production"]
    F --> G["📈 Monitor Progress"]
    G --> H["✅ Mark Complete"]
    
    B --> I["👥 Manage Suppliers"]
    B --> J["⚙️ Manage Machines"]
    B --> K["📊 View Analytics"]
    
    style A fill:#e1f5fe
    style H fill:#c8e6c9
    style D fill:#fff3e0
```

### **Negotiation Flow**
```mermaid
flowchart TD
    A["📋 Order Submitted"] --> B["💬 Admin Reviews"]
    B --> C["💰 Send Counter Offer"]
    C --> D["🤔 Client Decision"]
    D --> E{Accept?}
    E -->|Yes| F["✅ Agreement Reached"]
    E -->|No| G["💬 Send New Counter"]
    G --> D
    F --> H["💳 Payment Confirmation"]
    H --> I["🏭 Production Ready"]
    
    style F fill:#c8e6c9
    style I fill:#e8f5e8
```

---

## 📊 **State Management**

### **Order Status State Machine**
```mermaid
stateDiagram-v2
    [*] --> under_review: Order Submitted
    under_review --> negotiation: Admin Reviews
    under_review --> rejected: Admin Rejects
    negotiation --> awaiting_payment: Price Agreed
    negotiation --> rejected: Negotiation Fails
    awaiting_payment --> accepted: Payment Confirmed
    accepted --> in_production: Machine Assigned
    in_production --> completed: Production Done
    rejected --> [*]: Order Closed
    completed --> [*]: Order Closed
    
    note right of under_review
        Admin reviews order details
        and requirements
    end note
    
    note right of negotiation
        Price negotiation via
        chat system
    end note
    
    note right of accepted
        Requires machine assignment
        before production
    end note
```

### **Authentication State Flow**
```mermaid
stateDiagram-v2
    [*] --> unauthenticated: App Loads
    unauthenticated --> loading: Login Attempt
    loading --> authenticated: Login Success
    loading --> error: Login Failed
    error --> unauthenticated: Retry
    authenticated --> unauthenticated: Logout
    authenticated --> loading: Token Refresh
    
    note right of authenticated
        JWT token stored
        in localStorage
    end note
```

### **File Upload State**
```mermaid
stateDiagram-v2
    [*] --> idle: No File Selected
    idle --> uploading: File Selected
    uploading --> success: Upload Complete
    uploading --> error: Upload Failed
    success --> idle: Clear Form
    error --> idle: Retry Upload
    
    note right of uploading
        Progress indicator
        and validation
    end note
```

---

## 🔌 **API Documentation**

### **Authentication Endpoints**

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/auth/register/` | POST | User registration | `{email, password, confirm_password}` | `{user, token}` |
| `/api/auth/jwt/create/` | POST | JWT login | `{email, password}` | `{access, refresh}` |
| `/api/auth/jwt/refresh/` | POST | Refresh token | `{refresh}` | `{access}` |
| `/api/auth/me/` | GET | Get user profile | - | `{user}` |
| `/api/auth/me/` | PATCH | Update profile | `{first_name, last_name, ...}` | `{user}` |

### **Order Management Endpoints**

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/orders/` | GET | List orders | - | `[orders]` |
| `/api/orders/` | POST | Create order | `FormData` | `{order}` |
| `/api/orders/{id}/` | GET | Get order details | - | `{order}` |
| `/api/orders/{id}/` | PATCH | Update order | `{status, ...}` | `{order}` |
| `/api/orders/{id}/approve_order/` | POST | Approve order | `{machine_id, expected_date}` | `{order}` |
| `/api/orders/{id}/reject_order/` | POST | Reject order | `{rejection_reason}` | `{order}` |
| `/api/orders/{id}/start_production/` | POST | Start production | - | `{order}` |
| `/api/orders/{id}/complete_order/` | POST | Complete order | `{actual_cost}` | `{order}` |

### **Negotiation & Chat Endpoints**

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/orders/{id}/messages/` | GET | Get chat messages | - | `[messages]` |
| `/api/orders/{id}/messages/` | POST | Send message | `{message}` | `{message}` |
| `/api/orders/{id}/send_counter_offer/` | POST | Send counter offer | `{amount, message}` | `{message}` |
| `/api/orders/{id}/accept_counter_offer/` | POST | Accept offer | - | `{order}` |
| `/api/orders/{id}/confirm_payment/` | POST | Confirm payment | - | `{order}` |

### **Admin Management Endpoints**

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/suppliers/` | GET | List suppliers | - | `[suppliers]` |
| `/api/suppliers/` | POST | Create supplier | `{name, contact_info, ...}` | `{supplier}` |
| `/api/machines/` | GET | List machines | - | `[machines]` |
| `/api/machines/` | POST | Create machine | `{name, type, supplier, ...}` | `{machine}` |
| `/api/machines/available/` | GET | Available machines | - | `[machines]` |

### **API Response Examples**

#### **Order Object**
```json
{
  "id": 1,
  "client": 2,
  "client_name": "client@emesa.com",
  "client_company": "Acme Corp",
  "product_description": "Custom CNC part with precision tolerances",
  "step_file": "/media/step_files/part1.stp",
  "quantity": 100,
  "material_thickness": "5mm",
  "material_type": "Aluminum",
  "material_grade": "6061-T6",
  "surface_treatment": "Anodized",
  "packing_standard": "Standard",
  "target_price": "5000.00",
  "status": "negotiation",
  "date_submitted": "2024-01-15T10:30:00Z",
  "expected_completion_date": "2024-02-01",
  "machine": 3,
  "machine_name": "CNC Mill 1",
  "supplier_name": "Precision Manufacturing Co.",
  "admin_notes": "Urgent order - high priority client",
  "rejection_reason": null,
  "price_estimate": "5200.00",
  "actual_cost": null,
  "date_accepted": null,
  "date_production_started": null,
  "date_completed": null,
  "date_rejected": null,
  "agreed_price": "5100.00",
  "payment_confirmed": false
}
```

#### **Message Object**
```json
{
  "id": 10,
  "order": 1,
  "sender": 2,
  "sender_email": "admin@emesa.com",
  "sender_role": "admin",
  "message": "We can complete this order for $5100. This includes all finishing and packaging.",
  "timestamp": "2024-01-15T11:00:00Z",
  "is_admin": true,
  "type": "counter_offer",
  "amount": "5100.00"
}
```

---

## 🔐 **Security & Authentication**

### **Authentication Flow**
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant Database
    
    Client->>Frontend: Login Form
    Frontend->>Backend: POST /api/auth/jwt/create/
    Backend->>Database: Validate Credentials
    Database-->>Backend: User Data
    Backend-->>Frontend: JWT Tokens
    Frontend->>Frontend: Store in localStorage
    Frontend-->>Client: Redirect to Dashboard
    
    Note over Frontend,Backend: Subsequent Requests
    Frontend->>Backend: Authorization Header
    Backend->>Backend: Validate JWT
    Backend-->>Frontend: Protected Data
```

### **Security Features**
- **JWT Authentication** - Stateless token-based auth
- **Role-based Access Control** - Client, Admin, Supplier roles
- **CORS Protection** - Configured for production domains
- **Input Validation** - Comprehensive form and API validation
- **File Upload Security** - Type and size restrictions
- **HTTPS Enforcement** - Production SSL/TLS configuration

---

## 🚀 **Deployment Guide**

### **Production Architecture**
```mermaid
graph TB
    subgraph "Production Environment"
        LB["Load Balancer<br/>HTTPS Termination"]
        Nginx["Nginx Reverse Proxy<br/>Static Files + API Proxy"]
        App["Django Application<br/>Gunicorn Workers"]
        DB["MySQL Database<br/>Primary + Replica"]
        Storage["Object Storage<br/>Media Files"]
    end
    
    subgraph "Monitoring & Logging"
        Prometheus["Metrics Collection"]
        Grafana["Dashboard & Alerts"]
        ELK["Log Aggregation"]
    end
    
    LB --> Nginx
    Nginx --> App
    App --> DB
    App --> Storage
    App --> Prometheus
    App --> ELK
```

### **Docker Deployment**
```bash
# Development deployment
docker-compose up -d

# Production deployment (same compose file)
docker-compose -f docker-compose.yml up -d

# Environment variables
export DJANGO_SECRET_KEY="your-secret-key"
export DATABASE_URL="mysql://emesa_user:Emesa@123@db:3306/emesa_db"
export ALLOWED_HOSTS="localhost,127.0.0.1,your-domain.com"
export CORS_ALLOWED_ORIGINS="http://localhost:8080,https://your-domain.com"
```

### **Current Docker Compose Services**
```yaml
services:
  frontend:
    build: ./frontend
    # Internal only - no host port exposure
    volumes:
      - emesa_frontend_dist:/usr/share/nginx/html
    environment:
      - VITE_API_URL=/api/
    
  backend:
    build: ./backend
    # Internal only - no host port exposure
    command: gunicorn backend.wsgi:application --bind 0.0.0.0:8000
    
  db:
    image: mysql:8.0
    ports:
      - "3307:3306"  # Host port 3307 → Container port 3306
    
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"    # Host port 8080 → Container port 80
    volumes:
      - emesa_frontend_dist:/usr/share/nginx/html
```

### **Environment Configuration**

#### **Frontend Environment**
```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_NAME=Emesa Manufacturing
VITE_APP_VERSION=1.0.0
```

#### **Backend Environment**
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=mysql://user:pass@host:3306/emesa_db
ALLOWED_HOSTS=your-domain.com,api.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
MEDIA_URL=https://storage.your-domain.com/media/
```

### **Current Nginx Configuration**
```nginx
events {}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    server {
        listen 80;
        root /usr/share/nginx/html;  # Serves built React files
        
        # API Proxy to Backend
        location /api/ {
            proxy_pass http://backend:8000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Media files
        location /media/ {
            alias /app/media/;
            autoindex on;
        }
        
        # React Router - SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### **Production Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Media files
    location /media/ {
        alias /var/www/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Python 3.11+ and pip
- MySQL 8.0+
- Docker and Docker Compose

### **Quick Start**
```bash
# Clone repository
git clone https://github.com/your-org/emesa.git
cd emesa

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### **Production Deployment (Recommended)**
```bash
# Clone repository
git clone https://github.com/your-org/emesa.git
cd emesa

# Create environment files
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Start with automated setup
# For Linux/Mac:
chmod +x start.sh
./start.sh

# For Windows:
start.bat

# Or manually:
docker-compose up -d
```

### **Troubleshooting Common Issues**
- **Nginx welcome page**: The startup script handles this automatically
- **Database 500 errors**: The init script sets up proper permissions
- **Service not ready**: The startup script includes proper wait times

### **Docker Development**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Main app: http://localhost:8080
# Database: localhost:3307 (user: emesa_user, password: Emesa@123)

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Rebuild frontend (if needed)
docker-compose build frontend
docker-compose up -d frontend nginx

# Check service status
docker-compose ps
```

### **Database Setup**
```sql
-- Create database
CREATE DATABASE emesa_db;
CREATE USER 'emesa_user'@'localhost' IDENTIFIED BY 'Emesa@123';
GRANT ALL PRIVILEGES ON emesa_db.* TO 'emesa_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 📈 **Monitoring & Maintenance**

### **Health Checks**
```bash
# Application health
curl https://your-domain.com/api/health/

# Database connectivity
docker-compose exec backend python manage.py check --database default

# Cache connectivity
docker-compose exec backend python manage.py shell -c "from django.core.cache import cache; print(cache.get('test'))"
```

### **Log Management**
```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

### **Backup Procedures**
```bash
# Database backup
docker-compose exec postgres pg_dump -U emesa_user emesa_db > backup.sql

# Media files backup
tar -czf media_backup.tar.gz backend/media/

# Full system backup
docker-compose exec backend python manage.py dumpdata > full_backup.json
```
---

## 📞 **Support & Contact**

### **Technical Support**
- **Email**: support@emesa.com
- **Documentation**: https://docs.emesa.com
---

*Last updated: July 2025*
*Version: 1.0.0* 
