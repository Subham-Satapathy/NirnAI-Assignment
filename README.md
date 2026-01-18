# NirnAI - AI-Powered PDF Transaction Extraction System

A full-stack solution for extracting, translating, and managing Tamil real-estate transactions from PDF documents using OpenAI GPT-4.

---

## 🚀 Quick Start

### Option 1: With Docker (Recommended - 5 Minutes)

#### Prerequisites
- **Docker Desktop** ([Download](https://docs.docker.com/get-docker/))
- **OpenAI API Key** ([Get one](https://platform.openai.com/api-keys))

#### Setup (One Command)

```bash
git clone <repository-url>
cd NirnAI
make setup
```

**That's it!** The setup will:
1. Check Docker installation
2. Prompt you to add OpenAI API key to `.env`
3. Build all Docker containers
4. Start all services
5. Initialize database

#### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Login**: `admin` / `admin123`

#### Available Commands

```bash
make setup          # One-click setup (first time)
make start          # Start all services
make stop           # Stop all services
make restart        # Restart all services
make logs           # View all logs
make logs-backend   # Backend logs only
make logs-frontend  # Frontend logs only
make status         # Check services status
make clean          # Remove everything
make help           # Show all commands
```

---

### Option 2: Without Docker (Manual Setup - 15 Minutes)

#### Prerequisites
- **Node.js 20+** ([Download](https://nodejs.org/))
- **PostgreSQL 15+** ([Download](https://www.postgresql.org/download/))
- **Redis 7+** ([Download](https://redis.io/download/))
- **OpenAI API Key** ([Get one](https://platform.openai.com/api-keys))

#### Step 1: Install Dependencies

**macOS (using Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Redis
brew install redis
brew services start redis

# Install Node.js (if not installed)
brew install node@20
```

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Install Redis
sudo apt install redis-server
sudo systemctl start redis-server

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Windows:**
- Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install Redis from [redis.io/download](https://redis.io/download/) or use WSL
- Install Node.js from [nodejs.org](https://nodejs.org/)

#### Step 2: Setup Database

```bash
# Create PostgreSQL database and user
psql postgres << EOF
CREATE DATABASE nirnai_db;
CREATE USER nirnai_user WITH PASSWORD 'nirnai_password';
GRANT ALL PRIVILEGES ON DATABASE nirnai_db TO nirnai_user;
ALTER DATABASE nirnai_db OWNER TO nirnai_user;
\q
EOF
```

#### Step 3: Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use any text editor
```

Update these values in `.env`:
```bash
OPENAI_API_KEY=sk-proj-your-actual-key-here
DATABASE_URL=postgresql://nirnai_user:nirnai_password@localhost:5432/nirnai_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secure_random_string
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Step 4: Install Backend Dependencies

```bash
cd backend
npm install
```

#### Step 5: Initialize Database

```bash
# Still in backend directory
npm run db:migrate
```

#### Step 6: Start Backend

```bash
# Still in backend directory
npm run start:dev
```

Backend will run on **http://localhost:3001**

#### Step 7: Install Frontend Dependencies (New Terminal)

```bash
# Open new terminal
cd frontend
npm install
```

#### Step 8: Start Frontend

```bash
# Still in frontend directory
npm run dev
```

Frontend will run on **http://localhost:3000**

#### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Login**: `admin` / `admin123`

#### Verify Services

```bash
# Check PostgreSQL
psql -U nirnai_user -d nirnai_db -c "SELECT 1;"

# Check Redis
redis-cli ping  # Should return PONG

# Check Backend
curl http://localhost:3001

# Check Frontend
curl http://localhost:3000
```

## 🎯 Project Overview

NirnAI processes 30 years of Tamil real-estate transactions from PDF documents, translates Tamil text to English, stores data in PostgreSQL, and provides a searchable web interface with side-by-side PDF preview.

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + NestJS (REST API)
- OpenAI GPT-4o-mini (AI-powered extraction)
- Drizzle ORM (Database management)
- PostgreSQL (Data storage)
- Redis (Caching layer)
- pdf-parse (PDF extraction)
- Transliteration service (Tamil to English)

**Frontend:**
- Next.js 14 (React framework)
- Tailwind CSS (Styling)
- React-PDF (PDF viewer)
- Axios (API client)

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### System Flow

```
PDF Upload → Parse PDF → AI Extraction (GPT-4) → 
Translate Tamil → Apply Filters → Cache Results → Store in DB → Return JSON
```

## 📋 Features

✅ **AI-Powered Extraction**: OpenAI GPT-4o-mini for accurate transaction extraction  
✅ **Intelligent Caching**: Redis-based caching for instant duplicate PDF processing  
✅ **Parallel Processing**: Processes large PDFs in chunks with parallel execution  
✅ **Retry Mechanism**: Automatic retry with exponential backoff for reliability  
✅ **Smart Chunking**: Handles large documents by splitting into manageable chunks  
✅ **Token Optimization**: Optimized prompts to reduce API costs  
✅ **Intelligent Fallback**: Regex-based extraction when OpenAI is not configured  
✅ PDF upload and parsing  
✅ Tamil text extraction and automatic transliteration  
✅ Transaction filtering (buyer, seller, house no., survey no., document no.)  
✅ PostgreSQL storage with Drizzle ORM  
✅ RESTful API endpoints  
✅ Authentication system  
✅ Professional responsive UI  
✅ Dedicated transactions page with Excel-like layout  
✅ Transaction search and sorting  
✅ CSV export functionality  
✅ Loading states with progress indicators  

## 🔧 Configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Environment Setup

1. Clone the repository and navigate to the project:
```bash
cd NirnAI
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. **Configure OpenAI API Key** (Recommended for accurate extraction):
```bash
# Edit .env and add your OpenAI API key:
OPENAI_API_KEY=sk-proj-your-key-here
```
See [OPENAI_SETUP.md](OPENAI_SETUP.md) for detailed instructions.

4. Update other `.env` values if needed (defaults work for local development)

### Option 1: Docker Compose (Recommended)

Start all services with Docker:

```bash
docker-compose up --build
```

This will start:
- PostgreSQL on port 5432
- Backend API on port 3001
- Frontend on port 3000

### Option 2: Local Development

#### Backend Setup

```bash
cd backend
npm install

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Start backend
npm run start:dev
```

Backend will run on http://localhost:3001

#### Frontend Setup

```bash
---

## 📂 Project Structure

```
NirnAI/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── transaction.controller.ts
│   │   ├── services/
│   │   │   ├── openai-extraction.service.ts    # AI extraction with chunking
│   │   │   ├── pdf-parser.service.ts           # PDF parsing
│   │   │   ├── cache.service.ts                # Redis caching
│   │   │   ├── translation.service.ts          # Tamil transliteration
│   │   │   └── transaction.service.ts          # Business logic
│   │   ├── database/
│   │   │   ├── schema.ts                       # Drizzle schema
│   │   │   ├── db.ts                           # DB connection
│   │   │   ├── init.ts                         # DB initialization
│   │   │   └── migrate.ts                      # Migration runner
│   │   ├── dto/
│   │   │   └── transaction.dto.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                        # Login page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                    # Upload interface
│   │   │   └── transactions/
│   │   │       └── page.tsx                    # Transactions table
│   │   ├── components/
│   │   │   ├── UploadForm.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── TransactionsTable.tsx
│   │   ├── lib/
│   │   │   └── api.ts                          # API client
│   │   └── types/
│   │       └── index.ts
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml                          # Orchestration
├── Makefile                                    # Build automation
├── setup.sh                                    # Setup script
├── .env.example                                # Environment template
└── README.md
```

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────┐
│           Browser (localhost:3000)          │
│  Next.js 14 + React + TailwindCSS           │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────┐
│      NestJS Backend (localhost:3001)        │
│  ┌─────────────────────────────────────┐   │
│  │  Controllers                        │   │
│  │  • Auth • Transaction               │   │
│  └───────────┬─────────────────────────┘   │
│              ▼                              │
│  ┌─────────────────────────────────────┐   │
│  │  Services                           │   │
│  │  • OpenAI Extraction (GPT-4o-mini)  │   │
│  │  • PDF Parser (pdf-parse)           │   │
│  │  • Cache Service (Redis)            │   │
│  │  • Translation (Transliteration)    │   │
│  └───┬──────────────┬──────────────────┘   │
└──────┼──────────────┼──────────────────────┘
       │              │
   ┌───▼──────┐  ┌────▼─────┐
   │PostgreSQL│  │  Redis   │
   │Port: 5433│  │Port: 6379│
   │  Drizzle │  │  Cache   │
   │    ORM   │  │  Layer   │
   └──────────┘  └──────────┘
```

### Processing Flow

```
1. PDF Upload → 
2. Parse PDF (pdf-parse) → Extract Text → 
3. Check Cache (SHA-256 hash) → 
   ├─ Cache Hit: Return Cached Results (<1s)
   └─ Cache Miss: Continue...
4. Split into Chunks (15k tokens each) → 
5. Parallel Processing (2 chunks at a time) →
6. OpenAI GPT-4o-mini Extraction → 
7. Retry Mechanism (3 attempts, exponential backoff) → 
8. Transliteration (Tamil → English) → 
9. Apply Filters → 
10. Store in PostgreSQL → 
11. Cache Results (24h TTL) → 
12. Return JSON
```

---

## 🎯 Features

### Core Features
✅ **AI-Powered Extraction** - GPT-4o-mini with optimized prompts
✅ **Intelligent Caching** - Redis with SHA-256 deduplication
✅ **Parallel Processing** - Handles large PDFs with chunking
✅ **Retry Mechanism** - 3 attempts with exponential backoff
✅ **Token Optimization** - 60% reduction in API costs
✅ **Tamil Transliteration** - Unicode to English conversion
✅ **Professional UI** - Modern gradient design
✅ **Excel-like Table** - Search, sort, export functionality
✅ **Authentication** - JWT-based security

### Performance Optimizations
- **Chunking**: 15k tokens per chunk (respects rate limits)
- **Parallel**: Processes 2 chunks simultaneously
- **Caching**: Duplicate PDFs return in <1 second
- **Prompt**: Optimized from 800 to 200 characters
- **Tokens**: Reduced max_tokens from 16k to 8k

---

## 🗄️ Database Schema

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  buyer_name TEXT,
  buyer_name_tamil TEXT,
  seller_name TEXT,
  seller_name_tamil TEXT,
  house_number TEXT,
  survey_number TEXT,
  document_number TEXT,
  transaction_date TEXT,
  transaction_value NUMERIC,
  district TEXT,
  village TEXT,
  additional_info TEXT,
  pdf_file_name TEXT,
  extracted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX idx_buyer ON transactions(buyer_name);
CREATE INDEX idx_seller ON transactions(seller_name);
CREATE INDEX idx_survey ON transactions(survey_number);
CREATE INDEX idx_document ON transactions(document_number);
```

---

## 🔧 Configuration

### Environment Variables (`.env`)

```bash
# Required
OPENAI_API_KEY=sk-proj-your-key-here

# Database (auto-configured for Docker)
DATABASE_URL=postgresql://nirnai_user:nirnai_password@postgres:5432/nirnai_db

# Redis (auto-configured for Docker)
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=change_this_in_production

# Optional
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🧪 Testing the Application

### 1. Upload a PDF
1. Login with `admin` / `admin123`
2. Click "Choose PDF File"
3. Select a Tamil property transaction PDF
4. (Optional) Add filters
5. Click "Upload & Extract"

### 2. View Processing
```bash
make logs-backend  # Watch AI extraction in real-time
```

### 3. Check Results
- View transactions in Excel-like table
- Search by any field
- Sort columns
- Export to CSV

### 4. Test Caching
- Upload same PDF again
- Notice instant results (<1 second)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, TailwindCSS |
| **Backend** | NestJS, Node.js 20, TypeScript |
| **AI** | OpenAI GPT-4o-mini API |
| **Database** | PostgreSQL 15, Drizzle ORM |
| **Cache** | Redis 7, ioredis |
| **PDF** | pdf-parse |
| **Containerization** | Docker, Docker Compose |
| **Authentication** | JWT |

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker not running | Start Docker Desktop |
| Port 3000 in use | Run `make clean` then `make setup` |
| Database migration failed | Run `make db-init` |
| OpenAI API error | Check API key in `.env` and account credits |
| Redis connection failed | Run `docker-compose restart redis` |
| Backend not responding | Run `make logs-backend` to check errors |

---

## 📝 API Endpoints

### Authentication
```
POST /auth/login
Body: { username, password }
Returns: { accessToken, user }
```

### Transactions
```
POST /transactions/upload
Form: pdf (file), filters (optional)
Returns: { transactions[], totalExtracted, totalFiltered }

GET /transactions
Query: buyerName, sellerName, surveyNumber, etc.
Returns: { transactions[] }
```

---

## 🚀 Performance Metrics

- **Small PDF (10 pages)**: ~10-15 seconds
- **Medium PDF (50 pages)**: ~30-45 seconds  
- **Large PDF (100+ pages)**: ~60-90 seconds
- **Cached PDF**: <1 second
- **Token usage**: ~5k-8k per chunk
- **API calls**: 1 call per 15k tokens

---

## 🎓 How It Works

### AI Extraction Process
1. **PDF Parsing**: Extract raw text using pdf-parse
2. **Chunking**: Split large documents into 15k token chunks  
3. **OpenAI Processing**: Send to GPT-4o-mini with optimized prompts
4. **Parallel Execution**: Process 2 chunks simultaneously
5. **Retry Logic**: 3 attempts with exponential backoff
6. **Transliteration**: Convert Tamil → English phonetics
7. **Caching**: Store in Redis with SHA-256 hash
8. **Storage**: Save to PostgreSQL with indexes

### Fallback Strategy
If OpenAI unavailable → Automatic regex-based extraction

---

## 🔐 Security

- JWT authentication
- Default credentials for demo: `admin` / `admin123`
- Change `JWT_SECRET` in production
- `.env` not committed to git
- CORS configured

---

**Need help? Run `make logs` to check logs**

# NirnAI-Assignment
