.PHONY: help setup build up down restart logs clean \
	iam-setup iam-up iam-migrate iam-seed iam-swagger iam-test \
	project-setup project-test project-swagger \
	api-gateway-test \
	task-setup notification-setup file-setup analytics-setup api-gateway-setup frontend-setup \
	status

# Colors
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)Microservices Makefile Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

setup: build up iam-setup project-setup task-setup notification-setup file-setup analytics-setup api-gateway-setup frontend-setup status ## Full setup: build images, start services, migrate, seed, docs

build: ## Build all images
	@echo "$(BLUE)🔨 Building images...$(NC)"
	@docker-compose build

up: ## Start all Docker containers (infra + services)
	@echo "$(BLUE)📦 Starting Docker containers...$(NC)"
	@docker-compose up -d --build traefik mysql redis rabbitmq minio loki promtail grafana iam-service iam-nginx api-gateway frontend project-service || echo "$(YELLOW)⚠️  Some services may not be available yet$(NC)"
	@echo "$(BLUE)⏳ Waiting for services to be healthy...$(NC)"
	@sleep 10

down: ## Stop all Docker containers
	@echo "$(BLUE)🛑 Stopping Docker containers...$(NC)"
	docker-compose down

restart: down up ## Restart all services

restart-container: ## Restart a container (optional SERVICE=iam-service). If SERVICE is empty, restarts all.
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(BLUE)🔄 Restarting all containers...$(NC)"; \
		docker-compose restart; \
	else \
		echo "$(BLUE)🔄 Restarting container '$(SERVICE)'...$(NC)"; \
		docker-compose restart $(SERVICE); \
	fi

logs: ## Show logs from all services
	docker-compose logs -f

clean: ## Stop and remove all containers, volumes, and networks
	@echo "$(RED)🧹 Cleaning up...$(NC)"
	docker-compose down -v --remove-orphans

iam-setup: iam-up iam-migrate iam-seed iam-swagger ## Setup IAM service (start, migrate, seed, swagger)

iam-up: ## Start IAM service and its deps
	@echo "$(BLUE)🚀 Starting IAM service and dependencies...$(NC)"
	@docker-compose up -d --build traefik mysql redis rabbitmq minio loki promtail grafana iam-service iam-nginx api-gateway frontend || echo "$(YELLOW)⚠️  IAM may not be available yet$(NC)"
	@echo "$(BLUE)⏳ Waiting for IAM stack to be healthy...$(NC)"
	@sleep 8

iam-migrate: ## Run IAM service migrations
	@echo "$(BLUE)🗄️  Running IAM Service migrations...$(NC)"
	@docker-compose exec -T iam-service php artisan migrate --force || echo "$(YELLOW)⚠️  Migrations may need manual run$(NC)"

iam-seed: ## Run IAM service seeders
	@echo "$(BLUE)🌱 Seeding IAM Service data...$(NC)"
	@docker-compose exec -T iam-service php artisan db:seed --force || echo "$(YELLOW)⚠️  Seeders may need manual run$(NC)"

iam-swagger: ## Generate Swagger documentation for IAM service
	@echo "$(BLUE)📚 Generating Swagger documentation...$(NC)"
	@docker-compose exec -T iam-service php artisan l5-swagger:generate || echo "$(YELLOW)⚠️  Swagger generation may need manual run$(NC)"

iam-test: ## Run IAM service tests (composer test) with test override
	@echo "$(BLUE)🧪 Running IAM service tests...$(NC)"
	@docker-compose exec -T \
		-e APP_ENV=testing \
		-e DB_CONNECTION=sqlite \
		-e DB_DATABASE=:memory: \
		-e CACHE_STORE=array \
		-e QUEUE_CONNECTION=sync \
		-e SESSION_DRIVER=array \
		-e MAIL_MAILER=array \
		-e LOG_CHANNEL=null \
		-e LOG_STACK=null \
		-e LOG_LEVEL=emergency \
		-e LOG_DEPRECATIONS_CHANNEL=null \
		-e LOG_DEPRECATIONS_TRACE=false \
		iam-service sh -c "rm -f bootstrap/cache/config.php && php artisan config:clear && composer test" || echo "$(YELLOW)⚠️  Tests failed$(NC)"




project-setup: project-up project-migrate ## Setup Project service (start, migrate)

project-up: ## Start Project service
	@echo "$(BLUE)🚀 Starting Project service...$(NC)"
	@docker-compose up -d --build project-service || echo "$(YELLOW)⚠️  Project service may not be available yet$(NC)"
	@echo "$(BLUE)⏳ Waiting for Project service to be healthy...$(NC)"
	@sleep 5

project-migrate: ## Run Project service migrations
	@echo "$(BLUE)🗄️  Running Project Service migrations...$(NC)"
	@docker-compose exec -T project-service npx sequelize-cli db:migrate || echo "$(YELLOW)⚠️  Migrations may need manual run$(NC)"

project-test: ## Run Project service tests
	@echo "$(BLUE)🧪 Running Project service tests...$(NC)"
	@docker-compose exec -T project-service npm run test || echo "$(YELLOW)⚠️  Tests failed$(NC)"

project-swagger: ## Generate Swagger docs for Project service
	@echo "$(BLUE)📚 Generating Project service Swagger documentation...$(NC)"
	@docker-compose exec -T project-service npm run swagger || echo "$(YELLOW)⚠️  Swagger generation may need manual run$(NC)"

api-gateway-test: ## Run API Gateway tests
	@echo "$(BLUE)🧪 Running API Gateway tests...$(NC)"
	@docker-compose run --rm --no-deps api-gateway npm run test || echo "$(YELLOW)⚠️  Tests failed$(NC)"

task-setup:
	@echo "$(YELLOW)⚠️  Task service setup is not implemented yet (skipping).$(NC)"

notification-setup:
	@echo "$(YELLOW)⚠️  Notification service setup is not implemented yet (skipping).$(NC)"

file-setup:
	@echo "$(YELLOW)⚠️  File service setup is not implemented yet (skipping).$(NC)"

analytics-setup:
	@echo "$(YELLOW)⚠️  Analytics service setup is not implemented yet (skipping).$(NC)"

api-gateway-setup:
	@echo "$(BLUE)📦 Installing API Gateway deps...$(NC)"
	@cd services/api-gateway && npm install

frontend-setup:
	@echo "$(BLUE)📦 Installing Frontend deps...$(NC)"
	@cd services/frontend && npm install

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
		echo "    🌐 API:  https://iam-service.afeez-dev.local/api (via Traefik)"; \
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
		echo "    📚 Docs: https://notification-service.afeez-dev.local/api/docs"; \
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
		echo "    📚 Docs: https://api-gateway.afeez-dev.local/api/docs"; \
		echo "    ↪️  Proxies IAM: https://iam-service.afeez-dev.local"; \
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

