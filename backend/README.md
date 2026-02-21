# Backend — Clinic Manager API

REST API built with Node.js, Express 5, Prisma, and PostgreSQL.

## Start

```bash
# From the backend/ directory
npm run dev
```

Server available at `http://localhost:3001`.

## Environment variables

Create a `.env` file in `backend/` with:

```env
DATABASE_URL="postgresql://clinic_user:clinic_password@localhost:5432/clinic_manager"

JWT_SECRET="change-this-secret-at-least-32-characters"
JWT_REFRESH_SECRET="change-this-other-secret-different-64-chars"
ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_DAYS=7

NODE_ENV=development
PORT=3001
```

## Database

```bash
# Apply schema (development)
npx prisma db push

# Seed initial data
npm run seed

# Open Prisma Studio
npx prisma studio
```

### Seed credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clinica.mx | Admin1234! |
| Doctor | doctor@clinica.mx | Doctor1234! |

## Main endpoints

### Auth (`/api/auth`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/login` | Public | Sign in, returns JWT + refresh cookie |
| POST | `/logout` | Authenticated | Revokes refresh token and clears cookie |
| POST | `/refresh` | Public (cookie) | Rotates refresh token, returns new JWT |
| GET | `/me` | Authenticated | Current user profile |
| POST | `/change-password` | Authenticated | Change password (requires current password) |
| POST | `/forgot-password` | Public | Request reset (always responds 200) |
| POST | `/reset-password` | Public | Complete reset with token |
| GET | `/audit-logs` | Admin | Paginated audit logs |

### Users (`/api/users`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/me` | Authenticated | Own profile |
| PUT | `/me` | Authenticated | Update name, phone, CURP, RFC |
| GET | `/` | Admin | List all users |
| POST | `/` | Admin | Create user |
| PUT | `/:id` | Admin | Update user / activate-deactivate |
| DELETE | `/:id` | Admin | Deactivate user |

## Structure

```
src/
├── config/       # Configuration (env, constants)
├── controllers/  # HTTP handlers
├── middleware/   # Auth, errors, roles
├── routes/       # Route definitions
└── services/     # Business logic (auth, users, audit)
prisma/
├── schema.prisma
└── seed.ts
```
