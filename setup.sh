#!/bin/bash

# NirnAI - Automated Setup Script
# This script sets up the entire application with one command

set -e  # Exit on error

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${CYAN}"
echo "========================================"
echo "   NirnAI - Automated Setup Script     "
echo "========================================"
echo -e "${NC}"

# Function to print step
print_step() {
    echo -e "${YELLOW}[STEP $1/$2] $3${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if Docker is installed
print_step 1 6 "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed!"
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Check if .env file exists
print_step 2 6 "Checking environment configuration..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
# OpenAI API Key (Required)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://nirnai_user:nirnai_password@postgres:5432/nirnai_db

# JWT Secret (Change in production)
JWT_SECRET=your_jwt_secret_here_change_in_production

# Redis Configuration
REDIS_URL=redis://redis:6379

# Node Environment
NODE_ENV=development

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    
    print_success ".env file created"
    echo -e "${RED}⚠️  ACTION REQUIRED: Please edit the .env file and add your OpenAI API key${NC}"
    echo -e "${YELLOW}Get your key from: https://platform.openai.com/api-keys${NC}"
    echo ""
    read -p "Press Enter after you've added your OpenAI API key to continue..."
else
    print_success ".env file already exists"
fi

# Stop any running containers
print_step 3 6 "Stopping any running containers..."
docker-compose down 2>/dev/null || true
print_success "Containers stopped"

# Build Docker images
print_step 4 6 "Building Docker images (this may take a few minutes)..."
docker-compose build --no-cache
print_success "Docker images built"

# Start services
print_step 5 6 "Starting all services..."
docker-compose up -d
print_success "Services started"

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Initialize database
print_step 6 6 "Initializing database..."
docker-compose exec -T backend npm run db:migrate || {
    print_error "Database migration failed. You may need to run 'make db-init' manually"
}
print_success "Database initialized"

# Print completion message
echo ""
echo -e "${GREEN}========================================"
echo "   Setup Complete! 🎉                 "
echo "========================================${NC}"
echo ""
echo -e "${CYAN}Application URLs:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:3001${NC}"
echo -e "  Database:  ${GREEN}localhost:5433${NC}"
echo -e "  Redis:     ${GREEN}localhost:6379${NC}"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo "  View logs:         docker-compose logs -f"
echo "  Stop services:     docker-compose down"
echo "  Restart services:  docker-compose restart"
echo ""
echo -e "${CYAN}Or use Makefile commands:${NC}"
echo "  make logs          # View all logs"
echo "  make stop          # Stop all services"
echo "  make restart       # Restart all services"
echo "  make clean         # Clean up everything"
echo "  make help          # Show all commands"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
