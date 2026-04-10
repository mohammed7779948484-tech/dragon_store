# Core Module

## Purpose

Infrastructure layer providing foundational services used across all features and modules. Contains authentication, configuration, error handling, logging, rate limiting, and database access utilities.

## Dependencies

- `shared/types`, `shared/config` — Shared type definitions and constants
- External: `jose` (JWT), `zod` (validation), `lru-cache` (rate limiting), `@sentry/nextjs` (monitoring)

## Structure

```
src/core/
├── auth/
│   ├── encryption.ts      # JWT encrypt/decrypt using jose (HS256)
│   └── session.ts         # DAL pattern — verifySession(), createSession(), destroySession()
├── config/
│   ├── app.config.ts      # Application-level configuration
│   └── env.ts             # Zod-validated environment variables (fail-fast on invalid)
├── db/                    # Database utilities (reserved for future use)
├── errors/
│   └── app-error.ts       # AppError class (message, status, code, cause)
├── logger/
│   └── index.ts           # Logger class — console (dev) + Sentry (production)
└── rate-limit/
    └── index.ts           # LRU-based rate limiter (5/min gate, 20/min cart, 3/min checkout)
```

## Public API

| Export | Module | Description |
|--------|--------|-------------|
| `verifySession()` | `auth/session` | **DAL pattern** — cached session verification (React `cache()`) |
| `createSession(id, rememberMe)` | `auth/session` | Creates JWT session cookie (24h or 30d) |
| `destroySession()` | `auth/session` | Deletes session cookie |
| `encrypt(payload)` / `decrypt(token)` | `auth/encryption` | JWT operations using `jose` |
| `env` | `config/env` | Zod-validated `process.env` — throws on startup if invalid |
| `AppError` | `errors/app-error` | Structured error class (message, status HTTP code, code string, cause) |
| `Logger` | `logger/index` | Structured logging with Sentry integration and sensitive data masking |
| `rateLimit(config)` | `rate-limit/index` | LRU-cache rate limiter returning `{ check(token, limit) }` |

## Rules

- **Layer**: Core can only import from `shared/types` and `shared/config`
- **Security**: `verifySession()` MUST be called in every Server Component and Server Action before data access (DAL pattern)
- **Middleware**: Used for UX redirects ONLY — NOT for security (CVE-2025-29927)
- **Environment**: All env vars accessed through `env` object, never `process.env` directly
