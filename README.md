# 📋 Invoice Generator Application

A complete web-based invoice generator with user management, template builder, and PDF export.

## 🐳 Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed

### Run with Docker

1. **Clone the repository**
```bash
cd invoice-generator
```

2. **Build and start containers**
```bash
docker-compose up -d --build
```

3. **Access the application**
- Frontend: http://localhost
- Backend API: http://localhost:5000/api
- Change IP in compose file if needed

4. **Stop containers**
```bash
docker-compose down
```

5. **Stop and remove all data**
```bash
docker-compose down -v
```

### Docker Commands
```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up -d --build

# Check container status
docker-compose ps

# Execute command in container
docker-compose exec backend sh
docker-compose exec frontend sh

# View resource usage
docker stats
```
### 💻 Manual Installation (Without Docker)

# 📋 Invoice Generator Application

A complete web-based invoice generator with user management, template builder, and PDF export.

## 🚀 Features

- User authentication (Admin & Regular users)
- Drag-and-drop template builder
- Invoice generation with auto-numbering
- Customer & Item management
- PDF export with multi-page support
- Auto-calculation (subtotal, tax, total)

## 🛠️ Tech Stack

- **Frontend**: React 18.2.0
- **Backend**: Node.js + Express 4.18.2
- **Database**: SQLite3 5.1.6
- **PDF Generation**: jsPDF + html2canvas

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ and npm

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
npm install
```

2. Start the backend server:
```bash
npm start
```
Server runs on http://localhost:5000

# Frontend Setup
1. Navigate to frontend folder:
```bash
cd frontend
npm install
```

2. Start the frontend:
```bash
npm start
```
App opens on http://localhost:3000

### 👤 Default Login Credentials
# Admin Account:
- Email: admin@invoice.com
- Password: admin123


# Regular User:
- Email: user@invoice.com
- Password: user123

## 📖 Usage Guide
1. Login with provided credentials
2. Dashboard shows overview of invoices, customers, items
3. Create Templates using the drag-and-drop builder
4. Add Customers & Items from respective management pages
5. Generate Invoices by selecting template and adding items
6. Download PDF with single click

## 🗂️ Database
SQLite database auto-generated at backend/db/invoice.db with seed data.

## 📝 API Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/users - Get all users (Admin only)
- GET /api/customers - Get all customers
- POST /api/customers - Create customer
- GET /api/items - Get all items
- POST /api/items - Create item
- GET /api/invoices - Get all invoices
- POST /api/invoices - Create invoice
- GET /api/templates - Get all templates
- POST /api/templates - Create template

---

## 🚀 Build and Run Commands

## **Option 1: Quick Start**

```bash
# Navigate to project root
cd invoice-generator

# Build and start all containers
docker-compose up -d --build

# Wait ~30 seconds for initialization

# Access the app
# Frontend: http://localhost
# Backend: http://localhost:5000
```

## Option 2: Development Mode
```bash
# Build containers
docker-compose build

# Start containers with logs visible
docker-compose up

# Stop with Ctrl+C
```

## Option 3: Production Mode
```bash
# Build and start detached
docker-compose up -d --build

# Check health
docker-compose ps

# View logs
docker-compose logs -f
```

### 📊 Container Management
## View Logs:
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```
## Restart Services:
# Restart all
docker-compose restart

# Restart specific service
```bash
docker-compose restart backend
docker-compose restart frontend
```

## Stop and Remove:
```bash
# Stop containers (keep data)
docker-compose down

# Stop and remove volumes (delete all data)
docker-compose down -v
```

## Access Container Shell:
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

### 💾 Data Persistence
## Volumes:
- backend-db - SQLite database (survives container restarts)
- backend-uploads - Uploaded images (survives container restarts)

## Backup Data:
```bash
# Backup database
docker-compose exec backend cp /app/db/invoice.db /app/db/invoice-backup.db

# Copy backup to host
docker cp invoice-backend:/app/db/invoice-backup.db ./backup-$(date +%Y%m%d).db
```

## Restore Data:
```bash
# Copy backup to container
docker cp ./backup.db invoice-backend:/app/db/invoice.db

# Restart backend
docker-compose restart backend
```

### 🌐 Environment Variables
Create .env file in root directory:
```bash
# Backend
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
PORT=5000

# Frontend
REACT_APP_API_URL=http://localhost:5000
```
Then update docker-compose.yml:
```bash
backend:
  env_file:
    - .env
```

### 🔧 Troubleshooting
## Issue: Port already in use
```bash
# Check what's using port 80
sudo lsof -i :80

# Or change port in docker-compose.yml
ports:
  - "8080:80"  # Access via http://localhost:8080
```

## Issue: Backend not connecting
```bash
# Check backend logs
docker-compose logs backend

# Verify backend is healthy
docker-compose ps

# Restart backend
docker-compose restart backend
```

## Issue: Database not persisting
```bash
# Check volumes
docker volume ls

# Inspect volume
docker volume inspect invoice-generator_backend-db

# Ensure you're not using -v flag when stopping
docker-compose down  # ✅ Good - keeps data
docker-compose down -v  # ❌ Deletes data
```

## Issue: Frontend shows blank page
```bash
# Check nginx logs
docker-compose logs frontend

# Verify build completed
docker-compose build frontend

# Clear browser cache and hard refresh (Ctrl+Shift+R)
```

### 📈 Resource Limits
Add to docker-compose.yml if needed:
```bash
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M

frontend:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
```

### 🔒 Security Enhancements
## 1. Change JWT Secret:
```bash
# Generate random secret
openssl rand -base64 32
```
Add to .env:
```bash
JWT_SECRET=your-generated-secret-here
```

## 2. Use HTTPS in Production:
Update docker-compose.yml:
```bash
frontend:
  ports:
    - "443:443"
  volumes:
    - ./ssl:/etc/nginx/ssl
```

## 3. Restrict Network Access:
```bash
networks:
  invoice-network:
    driver: bridge
    internal: true  # No external access
```

### 🎯 Health Checks
Containers include health checks:
```bash
# Check health status
docker-compose ps

# Should show (healthy)
NAME                STATUS
invoice-backend     Up (healthy)
invoice-frontend    Up (healthy)
```

### 📦 Production Deployment
## Deploy to Cloud:
# 1. Push to Docker Hub:
```bash
docker tag invoice-generator_backend:latest yourusername/invoice-backend:latest
docker tag invoice-generator_frontend:latest yourusername/invoice-frontend:latest

docker push yourusername/invoice-backend:latest
docker push yourusername/invoice-frontend:latest
```

# 2. Update docker-compose.yml:
```bash
backend:
  image: yourusername/invoice-backend:latest
  
frontend:
  image: yourusername/invoice-frontend:latest
  ```

# 3. Deploy:
```bash
docker-compose up -d
```

### ✅ Verification Checklist
After running docker-compose up -d --build:

 - Check containers running: docker-compose ps
 - Backend healthy: curl http://localhost:5000/api/health
 - Frontend accessible: Open http://localhost
 - Login works: admin@invoice.com / admin123
 - Database persists: Stop/start containers, data remains
 - Images upload: Upload test image
 - PDF generation: Create and download invoice

Your complete invoice generator is now containerized and ready to deploy anywhere! 🐳✨

# Quick Start:
```bash
cd invoice-generator
docker-compose up -d --build
# Open http://localhost in browser
```
