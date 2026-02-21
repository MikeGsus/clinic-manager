# Frontend — Clinic Manager

SPA built with React, TypeScript, Vite, and shadcn/ui.

## Start

```bash
# From the frontend/ directory
npm run dev
```

Available at `http://localhost:5173`.

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Sign in |
| `/forgot-password` | Public | Request password reset |
| `/reset-password/:token` | Public | Complete password reset |
| `/` | Authenticated | Dashboard |
| `/profile` | Authenticated | Profile and security |
| `/users` | Admin | User management |
| `/admin/audit-logs` | Admin | Audit logs |

## Auth

- The **access token** lives in memory (Zustand), not in `localStorage` — protected against XSS.
- The **refresh token** travels as an `httpOnly` cookie — handled automatically by the browser.
- On app load, `AuthInitializer` silently attempts to renew the token if a previous session exists.
- The Axios interceptor handles 401 responses automatically: renews the token and replays queued requests.

## Structure

```
src/
├── components/
│   ├── auth/       # AuthInitializer, ChangePasswordDialog
│   ├── layout/     # Header, Sidebar
│   └── ui/         # shadcn/ui components
├── lib/
│   └── api.ts      # Axios with silent refresh interceptor
├── pages/
│   ├── auth/       # Login, ForgotPassword, ResetPassword
│   ├── profile/    # ProfilePage
│   ├── users/      # UsersPage, UserFormDialog
│   └── admin/      # AuditLogsPage
├── store/
│   └── auth.store.ts  # Zustand (token in memory, user persisted)
└── types/
    └── index.ts    # TypeScript interfaces
```

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```
