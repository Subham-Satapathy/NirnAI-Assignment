# Quick Start - Manual Setup (No Script Needed)

## Prerequisites
- Node.js 20+
- PostgreSQL running (local or remote)
- Redis running (local or remote)
- OpenAI API Key

## Steps

### 1. Create `.env` file in root directory

```bash
cat > .env <<EOF
DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_database
REDIS_URL=redis://your_redis_host:6379
OPENAI_API_KEY=sk-proj-your-key-here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
EOF
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

### 4. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 5. Start Backend (Terminal 1)

```bash
cd backend
npm run start:dev
```

Backend runs on: http://localhost:3001

### 6. Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:3000

## That's it! 🎉

Login with:
- Username: `admin`
- Password: `admin123`

---

## Using Docker Instead (Even Easier)

```bash
# Just add your OpenAI key to .env, then:
make setup
```

That's it! Everything runs automatically.
