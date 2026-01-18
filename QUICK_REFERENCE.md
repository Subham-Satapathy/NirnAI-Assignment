# NirnAI - Quick Reference Card

## Setup Options

### With Docker (Recommended)
```bash
make setup
# Opens http://localhost:3000
```

### Without Docker
```bash
./setup-manual.sh
# Then start services in 2 terminals:
# Terminal 1: cd backend && npm run start:dev
# Terminal 2: cd frontend && npm run dev
```

---

## 📝 Common Commands

### Docker
```bash
make start          # Start all services
make stop           # Stop all services
make logs           # View logs
make status         # Check status
make clean          # Remove everything
```

### Manual (No Docker)
```bash
make dev-backend    # Start backend
make dev-frontend   # Start frontend
make db-migrate-manual  # Run migrations
```

---

## 🔧 Troubleshooting

### Check Services
```bash
# PostgreSQL
psql -U nirnai_user -d nirnai_db -c "SELECT 1;"

# Redis
redis-cli ping

# Backend
curl http://localhost:3001

# Frontend
curl http://localhost:3000
```

### Restart Services

**Docker:**
```bash
make restart
```

**Manual:**
- Stop processes (Ctrl+C in terminals)
- Restart: `npm run start:dev` / `npm run dev`

---

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Login**: `admin` / `admin123`

---

## 📦 What Runs Where

| Service | Docker Port | Manual Port |
|---------|------------|-------------|
| Frontend | 3000 | 3000 |
| Backend | 3001 | 3001 |
| PostgreSQL | 5433 | 5432 |
| Redis | 6379 | 6379 |

---

## 💡 Quick Tips

1. **View real-time logs**: `make logs-backend` (Docker) or check terminal (Manual)
2. **Test caching**: Upload same PDF twice
3. **Check errors**: Look at terminal output or logs
4. **Reset database**: `make db-reset` (Docker) or drop and recreate (Manual)
5. **Clean slate**: `make clean` removes all Docker data

---

## 🆘 Need Help?

Run `make help` to see all available commands
