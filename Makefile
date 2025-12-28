.PHONY: help start-all stop-all start stop restart logs status clean build \
	migrate test setup-service

# Colors
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

# Service mappings
SERVICES := iam-service project-service notification-service api-gateway frontend task-service file-service analytics-service
INFRA := traefik mysql redis rabbitmq minio loki promtail grafana

help: ## Show help message
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)Microservices Makefile - Simple Commands$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)Main Commands:$(NC)"
	@echo "  $(GREEN)make start-all$(NC)                    Setup and start all services"
	@echo "  $(GREEN)make stop-all$(NC)                     Stop all services"
	@echo "  $(GREEN)make start [service]$(NC)              Start a service (or all)"
	@echo "  $(GREEN)make stop [service]$(NC)               Stop a specific service"
	@echo "  $(GREEN)make restart [service]$(NC)            Rebuild and restart a service"
	@echo "  $(GREEN)make logs [service]$(NC)               Show logs"
	@echo "  $(GREEN)make status$(NC)                       Show service status and URLs"
	@echo "  $(GREEN)make clean$(NC)                        Remove all containers/volumes"
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  $(GREEN)make start api-gateway$(NC)            Start only api-gateway"
	@echo "  $(GREEN)make restart project-service$(NC)       Rebuild and restart project-service"
	@echo "  $(GREEN)make migrate notification-service$(NC) Run notification migrations"
	@echo ""
	@echo "$(YELLOW)Service Commands:$(NC)"
	@echo "  $(GREEN)make migrate [service]$(NC)             Run migrations"
	@echo "  $(GREEN)make test [service]$(NC)                Run tests"
	@echo ""
	@echo "$(YELLOW)Available Services:$(NC)"
	@echo "  • iam-service"
	@echo "  • project-service"
	@echo "  • notification-service"
	@echo "  • api-gateway"
	@echo "  • frontend"
	@echo ""
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

# Full setup - builds, starts, migrates, seeds everything
start-all: build ## Setup and start all services
	@echo "$(BLUE)🚀 Starting all services...$(NC)"
	@docker-compose up -d --build $(INFRA) || true
	@sleep 5
	@docker-compose up -d --build $(SERVICES) || true
	@echo "$(BLUE)⏳ Waiting for services to be healthy...$(NC)"
	@sleep 10
	@echo "$(BLUE)🗄️  Running migrations...$(NC)"
	@$(MAKE) migrate iam-service || true
	@$(MAKE) migrate project-service || true
	@$(MAKE) migrate notification-service || true
	@echo "$(BLUE)🌱 Seeding IAM service...$(NC)"
	@docker-compose exec -T iam-service php artisan db:seed --force || true
	@echo "$(BLUE)📚 Generating Swagger docs...$(NC)"
	@docker-compose exec -T iam-service php artisan l5-swagger:generate || true
	@$(MAKE) status

# Stop all services
stop-all: ## Stop all services
	@echo "$(BLUE)🛑 Stopping all services...$(NC)"
	@docker-compose down

# Start a specific service or all
start: ## Start a service (usage: make start [service-name])
	@SERVICE_NAME="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$SERVICE_NAME" ]; then \
		echo "$(BLUE)📦 Starting all services...$(NC)"; \
		docker-compose up -d --build $(INFRA) $(SERVICES) || true; \
		$(MAKE) status; \
	else \
		echo "$(BLUE)🚀 Starting $$SERVICE_NAME...$(NC)"; \
		docker-compose up -d --build $$SERVICE_NAME || true; \
		sleep 3; \
		$(MAKE) status; \
	fi

# Stop a specific service
stop: ## Stop a service (usage: make stop [service-name])
	@SERVICE_NAME="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$SERVICE_NAME" ]; then \
		echo "$(YELLOW)⚠️  Please specify a service: make stop api-gateway$(NC)"; \
		echo "$(YELLOW)   Or use 'make stop-all' to stop all services$(NC)"; \
		exit 1; \
	else \
		echo "$(BLUE)🛑 Stopping $$SERVICE_NAME...$(NC)"; \
		docker-compose stop $$SERVICE_NAME; \
	fi

# Restart a specific service or all (with rebuild)
restart: ## Restart a service (usage: make restart [service-name])
	@SERVICE_NAME="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$SERVICE_NAME" ]; then \
		echo "$(BLUE)🔄 Restarting all services...$(NC)"; \
		docker-compose restart; \
	else \
		echo "$(BLUE)🔄 Rebuilding and restarting $$SERVICE_NAME...$(NC)"; \
		docker-compose up -d --build $$SERVICE_NAME || true; \
		sleep 3; \
		$(MAKE) status; \
	fi

# Show logs
logs: ## Show logs (usage: make logs [service-name])
	@SERVICE_NAME="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$SERVICE_NAME" ]; then \
		docker-compose logs -f; \
	else \
		docker-compose logs -f $$SERVICE_NAME; \
	fi

# Run migrations for a service
migrate: ## Run migrations (usage: make migrate [service-name])
	@SERVICE_NAME="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$SERVICE_NAME" ]; then \
		echo "$(RED)❌ Please specify a service: make migrate project-service$(NC)"; \
		exit 1; \
	fi
	@case "$$SERVICE_NAME" in \
		iam-service) \
			echo "$(BLUE)🗄️  Running IAM migrations...$(NC)"; \
			docker-compose exec -T iam-service php artisan migrate --force || true; \
			;; \
		project-service) \
			echo "$(BLUE)🗄️  Running Project migrations...$(NC)"; \
			docker-compose exec -T project-service npx sequelize-cli db:migrate || true; \
			;; \
		notification-service) \
			echo "$(BLUE)🗄️  Running Notification migrations...$(NC)"; \
			docker-compose exec -T notification-service npx sequelize-cli db:migrate || true; \
			;; \
		*) \
			echo "$(YELLOW)⚠️  Migrations not configured for $$SERVICE_NAME$(NC)"; \
			;; \
	esac

# Run tests for a service
test: ## Run tests (usage: make test [service-name])
	@SERVICE_NAME="$(filter-out $@,$(MAKECMDGOALS))"; \
	if [ -z "$$SERVICE_NAME" ]; then \
		echo "$(RED)❌ Please specify a service: make test iam-service$(NC)"; \
		exit 1; \
	fi; \
	case "$$SERVICE_NAME" in \
		iam-service) \
			echo "$(BLUE)🧪 Running IAM tests...$(NC)"; \
			docker-compose exec -T iam-service composer test || true; \
			;; \
		*) \
			echo "$(YELLOW)⚠️  Tests not configured for $$SERVICE_NAME$(NC)"; \
			;; \
	esac

# Prevent Make from treating service names as targets
%:
	@:

# Build all images
build: ## Build all Docker images
	@echo "$(BLUE)🔨 Building all images...$(NC)"
	@docker-compose build

# Clean everything
clean: ## Stop and remove all containers, volumes, and networks
	@echo "$(RED)🧹 Cleaning up everything...$(NC)"
	@docker-compose down -v --remove-orphans

# Status - keep the original status output
status: ## Display all service URLs and documentation links
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "$(GREEN)✅ Services Status$(NC)"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "$(BLUE)📋 Microservices:$(NC)"
	@echo ""
	@if docker-compose ps | grep -q "iam-service.*Up"; then \
		echo "$(YELLOW)✓ IAM Service (Laravel)$(NC)"; \
		echo "    🌐 API:  https://iam-service.afeez-dev.local/api"; \
		echo "    📚 Docs: https://iam-service.afeez-dev.local/api/docs"; \
		echo ""; \
	fi
	@if docker-compose ps | grep -q "project-service.*Up"; then \
		echo "$(YELLOW)✓ Project Service (Node.js)$(NC)"; \
		echo "    🌐 API:  https://project-service.afeez-dev.local/api"; \
		echo "    📚 Docs: https://project-service.afeez-dev.local/api/docs"; \
		echo ""; \
	fi
	@if docker-compose ps | grep -q "task-service.*Up"; then \
		echo "$(YELLOW)✓ Task Service (Node.js)$(NC)"; \
		echo "    🌐 API:  https://task-service.afeez-dev.local"; \
		echo "    📚 Docs: https://task-service.afeez-dev.local/api/docs"; \
		echo ""; \
	fi
	@if docker-compose ps | grep -q "notification-service.*Up"; then \
		echo "$(YELLOW)✓ Notification Service (Node.js)$(NC)"; \
		echo "    🌐 API:  https://notification-service.afeez-dev.local"; \
		echo "    💚 Health: https://notification-service.afeez-dev.local/health"; \
		echo ""; \
	fi
	@if docker-compose ps | grep -q "file-service.*Up"; then \
		echo "$(YELLOW)✓ File Service (Node.js)$(NC)"; \
		echo "    🌐 API:  https://file-service.afeez-dev.local"; \
		echo "    📚 Docs: https://file-service.afeez-dev.local/api/docs"; \
		echo ""; \
	fi
	@if docker-compose ps | grep -q "analytics-service.*Up"; then \
		echo "$(YELLOW)✓ Analytics Service (Node.js)$(NC)"; \
		echo "    🌐 API:  https://analytics-service.afeez-dev.local"; \
		echo "    📚 Docs: https://analytics-service.afeez-dev.local/api/docs"; \
		echo ""; \
	fi
	@if docker-compose ps | grep -q "api-gateway.*Up"; then \
		echo "$(YELLOW)✓ API Gateway (Node.js)$(NC)"; \
		echo "    🌐 API:  https://api-gateway.afeez-dev.local"; \
		echo "    ↪️  Proxies IAM Service: https://iam-service.afeez-dev.local"; \
		echo "    ↪️  Proxies Project Service: https://project-service.afeez-dev.local"; \
		echo "    ↪️  Proxies Task Service: https://task-service.afeez-dev.local"; \
		echo "    ↪️  Proxies Notification Service: https://notification-service.afeez-dev.local"; \
		echo "    ↪️  Proxies File Service: https://file-service.afeez-dev.local"; \
		echo "    ↪️  Proxies Analytics Service: https://analytics-service.afeez-dev.local"; \
		echo ""; \
	fi
	@if docker-compose ps | grep -q "frontend.*Up"; then \
		echo "$(YELLOW)✓ Frontend (Vue 3 + TypeScript)$(NC)"; \
		echo "    🌐 App:  https://app.afeez-dev.local"; \
		echo ""; \
	fi
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "$(BLUE)🔧 Infrastructure:$(NC)"
	@echo ""
	@echo "  🐰 RabbitMQ: https://rabbitmq.afeez-dev.local (admin/admin123)"
	@echo "  🗄️  MySQL:    localhost:3306"
	@echo "  📦 Redis:     localhost:6379"
	@echo "  📁 MinIO:     https://minio.afeez-dev.local (minioadmin/minioadmin123)"
	@echo "  📊 Grafana(For logs):   https://grafana.afeez-dev.local (admin/admin123)"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "$(GREEN)🎉 All services are ready!$(NC)"
	@echo ""
