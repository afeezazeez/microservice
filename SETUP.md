# Setup Guide

## Infrastructure / Local Domains & HTTPS

I front services with Traefik so you can hit friendly hostnames over HTTPS locally.

### Host entries
Add these to your hosts file (copy/paste ready):
```
127.0.0.1 app.afeez-dev.local
127.0.0.1 iam-service.afeez-dev.local
127.0.0.1 minio.afeez-dev.local
127.0.0.1 rabbitmq.afeez-dev.local
127.0.0.1 project-service.afeez-dev.local
127.0.0.1 task-service.afeez-dev.local
127.0.0.1 notification-service.afeez-dev.local
127.0.0.1 file-service.afeez-dev.local
127.0.0.1 api-gateway.afeez-dev.local
127.0.0.1 grafana.afeez-dev.local
```

How to edit hosts file:
- macOS / Linux: `sudo nano /etc/hosts` (or your editor of choice)
- Windows: open `C:\Windows\System32\drivers\etc\hosts` as Administrator and append the entries above

### Dev TLS (mkcert)
1) Install mkcert (see https://github.com/FiloSottile/mkcert#installation)  
   - macOS (easy): `brew install mkcert` and (if you use Firefox) `brew install nss`  
2) Generate local certs (one-time):
```bash
cd /path/to/your/microservices               # project root
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
  api-gateway.afeez-dev.local \
  grafana.afeez-dev.local
```
3) Start the stack (`make start-all`). Traefik serves HTTPS using those certs.

### Access URLs (once running)
- **Frontend App**: https://app.afeez-dev.local (proxy) or http://localhost:5173 (direct)
- IAM: https://iam-service.afeez-dev.local (proxy) or http://localhost:8001 (direct)
- API Gateway: https://api-gateway.afeez-dev.local (proxy) or http://localhost:3000 (direct)
- Project Service: https://project-service.afeez-dev.local (proxy) or http://localhost:3001 (direct)
- Task Service: https://task-service.afeez-dev.local (proxy) or http://localhost:3002 (direct)
- Notification Service: https://notification-service.afeez-dev.local (proxy) or http://localhost:3003 (direct)
- File Service: https://file-service.afeez-dev.local (proxy) or http://localhost:3004 (direct)
- MinIO console: https://minio.afeez-dev.local (proxy) or http://localhost:9001 (direct)
- RabbitMQ console: https://rabbitmq.afeez-dev.local (proxy) or http://localhost:15672 (direct)
- Grafana (logs UI): https://grafana.afeez-dev.local (proxy) or http://localhost:3009 (direct, admin/admin123)

---

## Environment Variables Setup

Each service has its own `.env` file. Copy the `.env.example` files and customize them.


### Quick Setup

```bash
# Copy .env.example to .env for each service
cp services/iam-service/.env.example services/iam-service/.env
cp services/project-service/.env.example services/project-service/.env
cp services/task-service/.env.example services/task-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp services/file-service/.env.example services/file-service/.env
cp services/api-gateway/.env.example services/api-gateway/.env
```

### Environment Variables by Service

#### IAM Service (`services/iam-service/.env`)
```env
APP_NAME="IAM Service"
APP_ENV=local
APP_DEBUG=true
APP_URL=https://iam-service.afeez-dev.local
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=iam_db
DB_USERNAME=root
DB_PASSWORD=rootpassword

REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_TTL=60
```

#### Project Service (`services/project-service/.env`)
```env
NODE_ENV=development
PORT=3001
APP_NAME="Project Service"
APP_URL=https://project-service.afeez-dev.local

DB_HOST=mysql
DB_PORT=3306
DB_NAME=project_db
DB_USER=root
DB_PASSWORD=rootpassword

RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
IAM_SERVICE_URL=http://iam-service:8000
```

#### Task Service (`services/task-service/.env`)
```env
NODE_ENV=development
PORT=3002
APP_NAME="Task Service"
APP_URL=https://task-service.afeez-dev.local

DB_HOST=mysql
DB_PORT=3306
DB_NAME=task_db
DB_USER=root
DB_PASSWORD=rootpassword

RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
IAM_SERVICE_URL=http://iam-service:8000
PROJECT_SERVICE_URL=http://project-service:3001
```

#### Notification Service (`services/notification-service/.env`)
```env
NODE_ENV=development
PORT=3003
APP_NAME="Notification Service"
APP_URL=https://notification-service.afeez-dev.local

DB_HOST=mysql
DB_PORT=3306
DB_NAME=notification_db
DB_USER=root
DB_PASSWORD=rootpassword

RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
IAM_SERVICE_URL=http://iam-service:8000
```

#### File Service (`services/file-service/.env`)
```env
NODE_ENV=development
PORT=3004
APP_NAME="File Service"
APP_URL=https://file-service.afeez-dev.local

DB_HOST=mysql
DB_PORT=3306
DB_NAME=file_db
DB_USER=root
DB_PASSWORD=rootpassword

RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
IAM_SERVICE_URL=http://iam-service:8000

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=task-files
```

#### API Gateway (`services/api-gateway/.env`)
```env
NODE_ENV=development
PORT=3000
APP_NAME="API Gateway"
APP_URL=https://api-gateway.afeez-dev.local

IAM_SERVICE_URL=http://iam-service:8000
PROJECT_SERVICE_URL=http://project-service:3001
TASK_SERVICE_URL=http://task-service:3002
NOTIFICATION_SERVICE_URL=http://notification-service:3003
FILE_SERVICE_URL=http://file-service:3004
JWT_SECRET=your-super-secret-jwt-key-change-in-production
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## Important Notes

1. **JWT_SECRET**: Must be the same in IAM Service, API Gateway, and all downstream services
2. **Database Names**: Each service has its own database (database-per-service pattern)
3. **Service URLs**: Use container names (e.g., `iam-service:8000`) not `localhost`
4. **RabbitMQ**: All services use the same RabbitMQ instance but different queues

## Starting Services

### Using Make (Recommended)

```bash
# 1. Create .env files (see above)
# 2. Start all services (builds, migrates, seeds)
make start-all

# 3. Start a specific service
make start api-gateway
make start project-service

# 4. Restart a service (with rebuild)
make restart project-service

# 5. Check logs
make logs                    # All services
make logs iam-service       # Specific service

# 6. Run migrations
make migrate iam-service
make migrate project-service
make migrate notification-service

# 7. Stop services
make stop-all               # Stop all services
make stop api-gateway       # Stop specific service

# 8. Show service status
make status

# 9. Clean everything
make clean
```

### Manual Setup (without Make)

```bash
# 1. Create .env files (see above)
# 2. Start all services
docker-compose up -d

# 3. Run migrations
docker-compose exec iam-service php artisan migrate --force
docker-compose exec iam-service php artisan db:seed --force
docker-compose exec project-service npx sequelize-cli db:migrate
docker-compose exec notification-service npx sequelize-cli db:migrate

# 4. Check logs
docker-compose logs -f [service-name]

# 5. Stop all services
docker-compose down
```
