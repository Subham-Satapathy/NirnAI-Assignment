.PHONY: setup start stop restart clean rebuild logs help db-init

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(CYAN)NirnAI - One-Click Deployment$(NC)"
	@echo ""
	@echo "$(GREEN)Docker Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v "manual" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Manual Setup (No Docker):$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep "manual" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

check-env: ## Check if .env file exists
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)[SETUP] Creating .env file...$(NC)"; \
		cp .env.example .env 2>/dev/null || echo "OPENAI_API_KEY=your_openai_api_key_here" > .env; \
		echo "$(RED)[ACTION REQUIRED] Please edit .env and add your OpenAI API key$(NC)"; \
		echo "$(YELLOW)Get your key from: https://platform.openai.com/api-keys$(NC)"; \
	else \
		echo "$(GREEN)[OK] .env file found$(NC)"; \
	fi

setup: check-env ## One-click setup: Build and start all services
	@echo "$(CYAN)========================================$(NC)"
	@echo "$(CYAN)   NirnAI - Setting Up Application     $(NC)"
	@echo "$(CYAN)========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)[STEP 1/4] Building Docker images...$(NC)"
	@docker-compose build --no-cache
	@echo ""
	@echo "$(YELLOW)[STEP 2/4] Starting services...$(NC)"
	@docker-compose up -d
	@echo ""
	@echo "$(YELLOW)[STEP 3/4] Waiting for database...$(NC)"
	@sleep 5
	@echo ""
	@echo "$(YELLOW)[STEP 4/4] Initializing database...$(NC)"
	@docker-compose exec -T backend npm run db:migrate || echo "$(RED)Database migration failed. Try 'make db-init' manually$(NC)"
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)   Setup Complete! 🎉                 $(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""
	@echo "$(CYAN)Application URLs:$(NC)"
	@echo "  Frontend:  $(GREEN)http://localhost:3000$(NC)"
	@echo "  Backend:   $(GREEN)http://localhost:3001$(NC)"
	@echo "  Database:  $(GREEN)localhost:5433$(NC)"
	@echo "  Redis:     $(GREEN)localhost:6379$(NC)"
	@echo ""
	@echo "$(YELLOW)View logs:$(NC)     make logs"
	@echo "$(YELLOW)Stop:$(NC)          make stop"
	@echo "$(YELLOW)Restart:$(NC)       make restart"
	@echo ""

start: check-env ## Start all services
	@echo "$(GREEN)[START] Starting all services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)[SUCCESS] All services started!$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:3001"

stop: ## Stop all services
	@echo "$(YELLOW)[STOP] Stopping all services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)[SUCCESS] All services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)[RESTART] Restarting all services...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)[SUCCESS] All services restarted!$(NC)"

clean: ## Stop and remove all containers, volumes, and images
	@echo "$(RED)[CLEAN] Removing all containers, volumes, and images...$(NC)"
	@docker-compose down -v --rmi all --remove-orphans
	@echo "$(GREEN)[SUCCESS] Cleanup complete!$(NC)"

rebuild: ## Rebuild and restart all services
	@echo "$(YELLOW)[REBUILD] Rebuilding all services...$(NC)"
	@docker-compose down
	@docker-compose build --no-cache
	@docker-compose up -d
	@sleep 5
	@docker-compose exec -T backend npm run db:migrate || echo "$(RED)Database migration failed$(NC)"
	@echo "$(GREEN)[SUCCESS] Rebuild complete!$(NC)"

logs: ## Show logs from all services
	@docker-compose logs -f

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

logs-db: ## Show database logs
	@docker-compose logs -f postgres

db-init: ## Initialize database manually (run Drizzle migrations)
	@echo "$(YELLOW)[DATABASE] Running Drizzle migrations...$(NC)"
	@docker-compose exec -T backend npm run db:migrate
	@echo "$(GREEN)[SUCCESS] Database migrated!$(NC)"

db-generate: ## Generate new Drizzle migration from schema changes
	@echo "$(YELLOW)[DRIZZLE] Generating migration from schema...$(NC)"
	@docker-compose exec -T backend npm run db:generate
	@echo "$(GREEN)[SUCCESS] Migration generated!$(NC)"

db-studio: ## Open Drizzle Studio (database GUI)
	@echo "$(CYAN)[DRIZZLE] Opening Drizzle Studio...$(NC)"
	@docker-compose exec backend npm run db:studio

db-push: ## Push schema changes directly to database (no migration)
	@echo "$(YELLOW)[DRIZZLE] Pushing schema to database...$(NC)"
	@docker-compose exec -T backend npm run db:push
	@echo "$(GREEN)[SUCCESS] Schema pushed!$(NC)"

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "$(RED)[WARNING] This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)[DATABASE] Resetting database...$(NC)"; \
		docker-compose down -v; \
		docker-compose up -d postgres redis; \
		sleep 5; \
		docker-compose up -d backend frontend; \
		sleep 5; \
		docker-compose exec -T backend npm run db:migrate; \
		echo "$(GREEN)[SUCCESS] Database reset complete!$(NC)"; \
	fi

status: ## Show status of all services
	@docker-compose ps

shell-backend: ## Open shell in backend container
	@docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	@docker-compose exec frontend sh

test: ## Run tests (if available)
	@echo "$(YELLOW)[TEST] Running tests...$(NC)"
	@docker-compose exec -T backend npm test || echo "$(YELLOW)No tests configured$(NC)"

install: setup ## Alias for setup

quick-start: ## Quick start (use existing build)
	@echo "$(GREEN)[QUICK START] Starting services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)[SUCCESS] Services started!$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:3001"

setup-manual: check-env ## [manual] Setup without Docker
	@echo "$(CYAN)[MANUAL SETUP] Starting manual installation...$(NC)"
	@chmod +x setup-manual.sh
	@./setup-manual.sh

dev-backend: ## [manual] Start backend in development mode
	@echo "$(GREEN)[BACKEND] Starting backend server...$(NC)"
	@cd backend && npm run start:dev

dev-frontend: ## [manual] Start frontend in development mode
	@echo "$(GREEN)[FRONTEND] Starting frontend server...$(NC)"
	@cd frontend && npm run dev

install-manual: ## [manual] Install all dependencies manually
	@echo "$(YELLOW)[INSTALL] Installing backend dependencies...$(NC)"
	@cd backend && npm install
	@echo "$(YELLOW)[INSTALL] Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)[SUCCESS] All dependencies installed!$(NC)"

db-setup-manual: ## [manual] Setup PostgreSQL database manually
	@echo "$(YELLOW)[DATABASE] Setting up PostgreSQL...$(NC)"
	@psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'nirnai_db'" | grep -q 1 || \
	psql -U postgres -c "CREATE DATABASE nirnai_db;"
	@psql -U postgres -c "CREATE USER nirnai_user WITH PASSWORD 'nirnai_password';" || true
	@psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE nirnai_db TO nirnai_user;"
	@psql -U postgres -c "ALTER DATABASE nirnai_db OWNER TO nirnai_user;"
	@echo "$(GREEN)[SUCCESS] Database configured!$(NC)"

db-migrate-manual: ## [manual] Run database migrations
	@echo "$(YELLOW)[DATABASE] Running Drizzle migrations...$(NC)"
	@cd backend && npm run db:migrate
	@echo "$(GREEN)[SUCCESS] Database migrated!$(NC)"

db-generate-manual: ## [manual] Generate new Drizzle migration
	@echo "$(YELLOW)[DRIZZLE] Generating migration from schema...$(NC)"
	@cd backend && npm run db:generate
	@echo "$(GREEN)[SUCCESS] Migration generated!$(NC)"

db-studio-manual: ## [manual] Open Drizzle Studio
	@echo "$(CYAN)[DRIZZLE] Opening Drizzle Studio...$(NC)"
	@cd backend && npm run db:studio

db-push-manual: ## [manual] Push schema directly (skip migration)
	@echo "$(YELLOW)[DRIZZLE] Pushing schema to database...$(NC)"
	@cd backend && npm run db:push
	@echo "$(GREEN)[SUCCESS] Schema pushed!$(NC)"

