# 🏢 NirnAI - Property Transaction Extraction System

AI-powered PDF extraction system for property transactions from Tamil Nadu registry documents.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- OpenAI API Key

### Option 1: Docker Setup (Recommended)

```bash
# 1. Start services
docker-compose up -d

# 2. Access applications
#    Frontend: http://localhost:3000
#    Backend: http://localhost:3001
```

### Option 2: Manual Setup

**1. Create Environment Files**

Backend `.env`:
```bash
cd backend
cat > .env << 'END'
DATABASE_URL=postgresql://user:password@localhost:5432/database
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-proj-your-key
JWT_SECRET=your_secret
NODE_ENV=development
END
cd ..
```

Frontend `.env.local` (optional):
```bash
cd frontend
cat > .env.local << 'END'
NEXT_PUBLIC_API_URL=http://localhost:3001
END
cd ..
```

**2. Install Dependencies**
```bash
npm install              # Install concurrently
npm run install:all      # Install backend + frontend
```

**3. Setup Database**
```bash
npm run migrate
```

**4. Start Development**
```bash
npm run dev              # Starts both backend + frontend
```

Or start individually:
```bash
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## 📋 Features

- **AI-Powered Extraction**: Uses OpenAI GPT-4o-mini for intelligent transaction extraction
- **Tamil Support**: Automatic transliteration of Tamil names to English
- **Real-time Progress**: See extraction progress with live updates
- **Smart Caching**: Redis-based caching for faster re-processing
- **Pagination**: Handle large datasets with built-in pagination
- **Export**: Download results as CSV
- **Authentication**: Secure JWT-based authentication

## 🏗️ Tech Stack

**Backend:**
- NestJS (Node.js framework)
- PostgreSQL (Database)
- Redis (Caching)
- OpenAI API (GPT-4o-mini)
- Drizzle ORM

**Frontend:**
- Next.js 14
- React
- TailwindCSS
- TypeScript

## 📝 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_URL=redis://host:6379

# OpenAI
OPENAI_API_KEY=sk-proj-your-key

# JWT
JWT_SECRET=your_secret

# Environment
NODE_ENV=development
```

## 🔧 Development

**Available Scripts:**
```bash
npm run install:all      # Install backend + frontend dependencies
npm run migrate          # Run database migrations
npm run dev              # Start both backend + frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run build            # Build both for production
npm run start            # Start both in production mode
npm run setup            # Full setup: install all + migrate
```

**Individual Commands:**
```bash
cd backend
npm run start:dev    # Development mode
npm run build        # Production build
npm run start:prod   # Production mode

cd frontend
npm run dev          # Development mode
npm run build        # Production build
npm run start        # Production mode
```

## 📊 API Endpoints

- `POST /auth/login` - User authentication
- `POST /transactions/upload` - Upload and extract PDF
- `GET /transactions` - Get transactions with filters
- `GET /transactions/search` - Search transactions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Add your license here]
