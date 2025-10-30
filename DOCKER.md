# Docker Setup Guide

This guide explains how to run IssueHub using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)

## Services

The `docker-compose.yml` file defines the following services:

- **postgres**: PostgreSQL 16 database
- **backend**: FastAPI application (Python)
- **frontend**: Next.js application (React/TypeScript)

## Quick Start

### 1. Start all services

```bash
docker-compose up -d
```

This will:
- Pull the PostgreSQL image
- Build the backend and frontend Docker images
- Start all services in the background
- Run database migrations automatically

### 2. Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Stop all services

```bash
docker-compose down
```

To also remove the database volume:
```bash
docker-compose down -v
```

## Development Workflow

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild after code changes

The services use volume mounts for hot-reloading, so most code changes will be reflected automatically. If you need to rebuild:

```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Run database migrations

Migrations run automatically when the backend starts. To run them manually:

```bash
docker-compose exec backend alembic upgrade head
```

To create a new migration:

```bash
docker-compose exec backend alembic revision --autogenerate -m "Description of changes"
```

### Access the database

```bash
docker-compose exec postgres psql -U issuehub -d issuehub
```

### Run backend tests

```bash
docker-compose exec backend pytest
```

### Install new dependencies

**Backend:**
```bash
# Add dependency to requirements.txt, then:
docker-compose exec backend pip install -r requirements.txt
# Or rebuild:
docker-compose up -d --build backend
```

**Frontend:**
```bash
# Add dependency to package.json, then:
docker-compose exec frontend npm install
# Or rebuild:
docker-compose up -d --build frontend
```

## Environment Variables

### Backend (.env)

Copy `backend/.env.example` to `backend/.env` and modify as needed:

```env
DATABASE_URL=postgresql://issuehub:issuehub_password@postgres:5432/issuehub
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Frontend (.env.local)

Copy `frontend/.env.example` to `frontend/.env.local` and modify as needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production Deployment

For production, you should:

1. **Generate a secure SECRET_KEY**:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Update database credentials** in `docker-compose.yml`

3. **Use production build for frontend**:
   ```bash
   # Modify docker-compose.yml to use target: production
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **Set up proper reverse proxy** (nginx, Traefik, etc.)

5. **Enable HTTPS** with SSL certificates

## Troubleshooting

### Database connection errors

If the backend can't connect to the database, ensure the PostgreSQL service is healthy:

```bash
docker-compose ps
```

### Port conflicts

If ports 3000, 8000, or 5432 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Change host port (left side)
```

### Reset database

To start fresh with a clean database:

```bash
docker-compose down -v
docker-compose up -d
```

### Frontend build errors

If you encounter Node.js memory issues:

```bash
docker-compose exec frontend npm run build -- --max_old_space_size=4096
```

## Network Architecture

```
┌─────────────┐
│   Frontend  │ :3000
│  (Next.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ :8000
│  (FastAPI)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PostgreSQL │ :5432
│  (Database) │
└─────────────┘
```

All services communicate within a Docker network. The frontend makes API calls to the backend, which queries the PostgreSQL database.
