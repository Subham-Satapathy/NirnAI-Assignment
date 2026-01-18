#!/bin/bash

# NirnAI - Manual Setup Script (Without Docker)
# This script helps set up the application without Docker

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "========================================"
echo "   NirnAI - Manual Setup (No Docker)   "
echo "========================================"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo -e "${YELLOW}[STEP $1] $2${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check Node.js
print_step "1/8" "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION is installed"
else
    print_error "Node.js is not installed!"
    echo "Please install Node.js 20+ from: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION is installed"
else
    print_error "npm is not installed!"
    exit 1
fi

# Check PostgreSQL
print_step "2/8" "Checking PostgreSQL installation..."
if command_exists psql; then
    print_success "PostgreSQL is installed"
else
    print_error "PostgreSQL is not installed!"
    echo ""
    echo "Install PostgreSQL:"
    echo "  macOS: brew install postgresql@15"
    echo "  Ubuntu: sudo apt install postgresql"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check Redis
print_step "3/8" "Checking Redis installation..."
if command_exists redis-cli; then
    print_success "Redis is installed"
    # Try to ping Redis
    if redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_error "Redis is not running!"
        echo "Start Redis:"
        echo "  macOS: brew services start redis"
        echo "  Linux: sudo systemctl start redis-server"
        exit 1
    fi
else
    print_error "Redis is not installed!"
    echo ""
    echo "Install Redis:"
    echo "  macOS: brew install redis"
    echo "  Ubuntu: sudo apt install redis-server"
    echo "  Windows: Use WSL or download from redis.io"
    exit 1
fi

# Create .env file
print_step "4/8" "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_success ".env file created"
    echo ""
    echo -e "${RED}⚠️  ACTION REQUIRED: Please edit .env and add your OpenAI API key${NC}"
    echo -e "${YELLOW}Get your key from: https://platform.openai.com/api-keys${NC}"
    echo ""
    echo "Update these values in .env:"
    echo "  OPENAI_API_KEY=sk-proj-your-key-here"
    echo "  DATABASE_URL=postgresql://nirnai_user:nirnai_password@localhost:5432/nirnai_db"
    echo "  REDIS_URL=redis://localhost:6379"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
else
    print_success ".env file already exists"
fi

# Setup PostgreSQL database
print_step "5/8" "Setting up PostgreSQL database..."
echo "Creating database and user..."

# Try to create database
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'nirnai_db'" | grep -q 1 || \
psql -U postgres <<EOF
CREATE DATABASE nirnai_db;
CREATE USER nirnai_user WITH PASSWORD 'nirnai_password';
GRANT ALL PRIVILEGES ON DATABASE nirnai_db TO nirnai_user;
ALTER DATABASE nirnai_db OWNER TO nirnai_user;
EOF

if [ $? -eq 0 ]; then
    print_success "Database created successfully"
else
    print_error "Failed to create database. You may need to run this manually:"
    echo "  psql -U postgres"
    echo "  CREATE DATABASE nirnai_db;"
    echo "  CREATE USER nirnai_user WITH PASSWORD 'nirnai_password';"
    echo "  GRANT ALL PRIVILEGES ON DATABASE nirnai_db TO nirnai_user;"
fi

# Install backend dependencies
print_step "6/8" "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

# Run database migrations
print_step "7/8" "Running database migrations..."
npm run db:migrate
print_success "Database initialized"

# Install frontend dependencies
print_step "8/8" "Installing frontend dependencies..."
cd ../frontend
npm install
print_success "Frontend dependencies installed"

# Go back to root
cd ..

# Print completion message
echo ""
echo -e "${GREEN}========================================"
echo "   Setup Complete! 🎉                 "
echo "========================================${NC}"
echo ""
echo -e "${CYAN}To start the application:${NC}"
echo ""
echo -e "${YELLOW}Terminal 1 - Start Backend:${NC}"
echo "  cd backend"
echo "  npm run start:dev"
echo ""
echo -e "${YELLOW}Terminal 2 - Start Frontend:${NC}"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo -e "${CYAN}Application URLs:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${CYAN}Login Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
