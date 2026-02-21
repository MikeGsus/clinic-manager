# Clinic Manager

Medical clinic management system for Mexico. Monorepo with a Node.js/Express backend and React/TypeScript frontend.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express 5 + Prisma + PostgreSQL |
| Frontend | React + TypeScript + Vite + shadcn/ui + Tailwind CSS |
| Auth | JWT (access 15min) + Refresh Tokens (httpOnly cookie, 7 days) |
| Database | PostgreSQL 16 via Docker |

## Requirements

- Node.js 20+
- Docker + Docker Compose

## Quick start

```bash
# 1. Clone and install dependencies
npm install

# 2. Start the database
docker compose up -d postgres

# 3. Configure environment (see backend/README.md)
cp backend/.env.example backend/.env

# 4. Apply schema and seed data
cd backend && npx prisma db push && npm run seed

# 5. Start everything (backend + frontend)
npm run dev
```

URLs:
- Frontend: http://localhost:5173
- API: http://localhost:3001

## Project structure

```
clinic-manager/
├── backend/          # REST API (Express + Prisma)
├── frontend/         # SPA (React + Vite)
├── docker-compose.yml
└── package.json      # npm workspaces
```

## User roles

| Role | Access |
|------|--------|
| admin | Full access, user management, audit logs |
| doctor | Own schedule, full patient records |
| enfermera | Consultation support, limited records |
| recepcionista | Appointments, basic patient data |
| paciente | Limited portal (appointments, personal data) |

## Main commands

```bash
npm run dev          # Start backend and frontend concurrently
npm run build        # Production build (both)
```
