# Setup Guide

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
cp services/analytics-service/.env.example services/analytics-service/.env
cp services/api-gateway/.env.example services/api-gateway/.env
```

### Environment Variables by Service

#### IAM Service (`services/iam-service/.env`)
```env
APP_NAME="IAM Service"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8001

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

#### Analytics Service (`services/analytics-service/.env`)
```env
NODE_ENV=development
PORT=3005
APP_NAME="Analytics Service"

DB_HOST=mysql
DB_PORT=3306
DB_NAME=analytics_db
DB_USER=root
DB_PASSWORD=rootpassword

RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
IAM_SERVICE_URL=http://iam-service:8000
```

#### API Gateway (`services/api-gateway/.env`)
```env
NODE_ENV=development
PORT=3000
APP_NAME="API Gateway"

IAM_SERVICE_URL=http://iam-service:8000
PROJECT_SERVICE_URL=http://project-service:3001
TASK_SERVICE_URL=http://task-service:3002
NOTIFICATION_SERVICE_URL=http://notification-service:3003
FILE_SERVICE_URL=http://file-service:3004
ANALYTICS_SERVICE_URL=http://analytics-service:3005

JWT_SECRET=your-super-secret-jwt-key-change-in-production
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## Important Notes

1. **JWT_SECRET**: Must be the same in IAM Service and API Gateway
2. **Database Names**: Each service has its own database (database-per-service pattern)
3. **Service URLs**: Use container names (e.g., `iam-service:8000`) not `localhost`
4. **RabbitMQ**: All services use the same RabbitMQ instance but different queues

## Starting Services

```bash
# 1. Create .env files (see above)
# 2. Start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f [service-name]

# 4. Stop all services
docker-compose down
```


