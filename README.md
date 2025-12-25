# Task Management Platform - Microservices Architecture

A comprehensive microservices demonstration project showcasing:
- Microservices architecture
- API Gateway pattern
- RabbitMQ messaging (Direct, Topic, Fanout exchanges)
- IAM (Identity and Access Management)
- HTTP calls, Async operations, RPC calls
- Best practices at senior level

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      Frontend (Vue 3 + TS + Tailwind)   │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────┐
│      API Gateway (Node.js + TS)         │
│      Port: 3000                         │
└──┬──────┬──────┬──────┬──────┬──────────┘
   │      │      │      │      │
   │      │      │      │      │ HTTP/RabbitMQ
   ▼      ▼      ▼      ▼      ▼
┌────┐ ┌─────┐ ┌────┐ ┌────┐ ┌─────┐
│IAM │ │Proj │ │Task│ │Notif│ │File │
│Laravel│ │Node│ │Node│ │Node│ │Node│
└────┘ └─────┘ └────┘ └────┘ └─────┘
```

## Microservices

### 1. IAM Service (Laravel 12)
- **Port**: 8001
- **Responsibilities**: Authentication, User Management, Roles, Permissions, Policies
- **Database**: `iam_db` (MySQL)
- **Tech**: Laravel 12, MySQL

### 2. Project Service (Node.js + TS)
- **Port**: 3001
- **Responsibilities**: Projects, Teams, Workspaces
- **Database**: `project_db` (MySQL with Sequelize)
- **Tech**: Node.js, TypeScript, Express, Sequelize

### 3. Task Service (Node.js + TS)
- **Port**: 3002
- **Responsibilities**: Tasks, Subtasks, Assignments
- **Database**: `task_db` (MySQL with Sequelize)
- **Tech**: Node.js, TypeScript, Express, Sequelize

### 4. Notification Service (Node.js + TS)
- **Port**: 3003
- **Responsibilities**: Real-time notifications, Email
- **Database**: `notification_db` (MySQL with Sequelize)
- **Tech**: Node.js, TypeScript, Express

### 5. File Service (Node.js + TS)
- **Port**: 3004
- **Responsibilities**: File uploads, Processing, Storage
- **Database**: `file_db` (MySQL with Sequelize)
- **Storage**: MinIO (S3-compatible) for local dev, AWS S3 for production
- **Tech**: Node.js, TypeScript, Express

### 6. Analytics Service (Node.js + TS)
- **Port**: 3005
- **Responsibilities**: Reports, Dashboards, Metrics
- **Database**: `analytics_db` (MySQL with Sequelize)
- **Tech**: Node.js, TypeScript, Express

### 7. API Gateway (Node.js + TS)
- **Port**: 3000
- **Responsibilities**: Routing, Auth validation, IAM checks
- **Tech**: Node.js, TypeScript, Express

## RabbitMQ Patterns

### Direct Exchange
- Task assignment → Specific user notification
- Direct messages between users

### Topic Exchange
- `project.{projectId}.task.created` → Notify project members
- `user.{userId}.notification.*` → User-specific notifications

### Fanout Exchange
- System-wide announcements
- Broadcast maintenance notifications

### RPC Calls (HTTP-based)
- API Gateway → IAM Service: Validate JWT, Check permissions (HTTP)
- Services → IAM Service: Permission checks (HTTP)

## Infrastructure / Local Domains & HTTPS

I front services with Traefik so you can hit friendly hostnames over HTTPS locally.

### Host entries
Add these to your hosts file (copy/paste ready):
```
127.0.0.1 app.afeez-dev.local
127.0.0.1 app.afeez-dev.local
127.0.0.1 api-gateway.afeez-dev.local
127.0.0.1 iam-service.afeez-dev.local
127.0.0.1 project-service.afeez-dev.local
127.0.0.1 task-service.afeez-dev.local
127.0.0.1 notification-service.afeez-dev.local
127.0.0.1 file-service.afeez-dev.local
127.0.0.1 analytics-service.afeez-dev.local
127.0.0.1 minio.afeez-dev.local
127.0.0.1 rabbitmq.afeez-dev.local
127.0.0.1 grafana.afeez-dev.local
```

How to edit hosts file:
- macOS / Linux: `sudo nano /etc/hosts` (or use your editor of choice)
- Windows: open `C:\Windows\System32\drivers\etc\hosts` as Administrator and append the entries above
```
127.0.0.1 iam-service.local
127.0.0.1 minio.local
127.0.0.1 rabbitmq.local
127.0.0.1 project-service.local
127.0.0.1 task-service.local
127.0.0.1 notification-service.local
127.0.0.1 file-service.local
127.0.0.1 analytics-service.local
127.0.0.1 api-gateway.local
```

### Dev TLS (mkcert)
1) Install mkcert (see https://github.com/FiloSottile/mkcert#installation)  
   - macOS (easy): `brew install mkcert` and (if you use Firefox) `brew install nss`  
2) Generate local certs (one-time):
```bash
cd /Users/chillingloccini/Desktop/microservices    # or your cloned repo path
mkdir -p infra/traefik/certs

mkcert -install
mkcert -key-file infra/traefik/certs/local-key.pem -cert-file infra/traefik/certs/local-cert.pem \
  app.afeez-dev.local \
  iam-service.afeez-dev.local \
  minio.afeez-dev.local \
  rabbitmq.afeez-dev.local \
  project-service.afeez-dev.local \
  task-service.afeez-dev.local \
  notification-service.afeez-dev.local \
  file-service.afeez-dev.local \
  analytics-service.afeez-dev.local \
  api-gateway.afeez-dev.local \
  grafana.afeez-dev.local
```
3) Start the stack (`make setup` or `make up`). Traefik serves HTTPS using those certs.

### Access URLs (once running)
- **Frontend App**: https://app.afeez-dev.local (proxy) or http://localhost:5173 (direct)
- IAM: https://iam-service.afeez-dev.local (proxy) or http://localhost:8001 (direct)
- API Gateway: https://api-gateway.afeez-dev.local (proxy) or http://localhost:3000 (direct)
- Project Service: https://project-service.afeez-dev.local (proxy) or http://localhost:3001 (direct)
- Task Service: https://task-service.afeez-dev.local (proxy) or http://localhost:3002 (direct)
- Notification Service: https://notification-service.afeez-dev.local (proxy) or http://localhost:3003 (direct)
- File Service: https://file-service.afeez-dev.local (proxy) or http://localhost:3004 (direct)
- Analytics Service: https://analytics-service.afeez-dev.local (proxy) or http://localhost:3005 (direct)
- MinIO console: https://minio.afeez-dev.local (proxy) or http://localhost:9001 (direct)
- RabbitMQ console: https://rabbitmq.afeez-dev.local (proxy) or http://localhost:15672 (direct)
- Grafana (logs UI): https://grafana.afeez-dev.local (proxy) or http://localhost:3009 (direct, admin/admin123)

### Service endpoints (summary)
| Service                | Proxy URL                                      | Direct Port    | Status       |
|------------------------|-----------------------------------------------|----------------|--------------|
| IAM (Laravel)          | https://iam-service.afeez-dev.local           | 8001           | Implemented  |
| API Gateway (Node)     | https://api-gateway.afeez-dev.local           | 3000           | Implemented  |
| Project Service (Node) | https://project-service.afeez-dev.local       | 3001           | Implemented  |
| Task Service (Node)    | https://task-service.afeez-dev.local          | 3002           | Implemented  |
| Notification Service   | https://notification-service.afeez-dev.local  | 3003           | Implemented  |
| File Service           | https://file-service.afeez-dev.local          | 3004           | Implemented  |
| Analytics Service      | https://analytics-service.afeez-dev.local     | 3005           | Implemented  |
| MinIO Console          | https://minio.afeez-dev.local                 | 9001           | Implemented  |
| RabbitMQ Console       | https://rabbitmq.afeez-dev.local              | 15672          | Implemented  |

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Make (optional, but recommended)
- Node.js 18+ (for local development)
- PHP 8.2+ (for Laravel local development)
- Composer (for Laravel local development)

### Quick Start

1. Clone the repository
```bash
git clone <repo-url>
cd microservices
```

2. Run setup (starts all services, runs migrations, seeds data, generates docs)
```bash
make setup
```

This will:
- Start all Docker containers
- Run IAM Service migrations
- Seed IAM Service data
- Generate Swagger documentation
- Display all service URLs and documentation links

### Available Make Commands

```bash
make help          # Show all available commands
make setup         # Complete setup (up + migrations + seed + docs + status)
make up            # Start all Docker containers
make down          # Stop all Docker containers
make restart       # Restart all services
make status        # Display all service URLs and docs
make logs          # Show logs from all services
make clean         # Stop and remove all containers/volumes
make iam-setup     # Setup IAM service (migrate + seed + swagger)
make iam-migrate   # Run IAM migrations only
make iam-seed      # Run IAM seeders only
make iam-swagger   # Generate IAM Swagger docs only
make iam-test      # Run IAM service tests
```

### Manual Setup (without Make)

1. Start all services
```bash
docker-compose up -d
```

2. Run migrations
```bash
# IAM Service
docker-compose exec iam-service php artisan migrate --force
docker-compose exec iam-service php artisan db:seed --force
docker-compose exec iam-service php artisan l5-swagger:generate
```

3. Start Frontend (when ready)
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
microservices/
├── services/
│   ├── iam-service/          # Laravel 12 (iam_db)
│   ├── project-service/       # Node.js + TS (project_db)
│   ├── task-service/          # Node.js + TS (task_db)
│   ├── notification-service/  # Node.js + TS (notification_db)
│   ├── file-service/          # Node.js + TS (file_db)
│   ├── analytics-service/      # Node.js + TS (analytics_db)
│   └── api-gateway/           # Node.js + TS (no DB)
├── docker/
│   └── mysql/
│       └── init-databases.sql  # Creates separate DBs for each service
├── frontend/                   # Vue 3 + TS + Tailwind
├── docker-compose.yml
└── README.md
```

## Database Architecture

**Database-per-Service Pattern** - Each microservice has its own database:

- `iam_db` - IAM Service
- `project_db` - Project Service
- `task_db` - Task Service
- `notification_db` - Notification Service
- `file_db` - File Service
- `analytics_db` - Analytics Service

All databases run on a single MySQL instance (can be split into separate instances for production).

## Communication Patterns

### HTTP (Synchronous)
- Frontend → API Gateway → Services
- Service-to-service calls (when needed)

### RabbitMQ (Asynchronous)
- Task created → Notification Service
- File uploaded → Analytics Service
- Project updated → Notification Service

### RPC (Synchronous HTTP)
- Permission checks: API Gateway → IAM Service (HTTP)
- Token validation: API Gateway → IAM Service (HTTP)
- Data validation: Service-to-service HTTP calls

## Environment Variables

Each service has its own `.env` file. See individual service READMEs for details.

## License

ISC

