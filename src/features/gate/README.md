# Gate Feature

## Purpose

Site-wide password protection with session-based authentication. Visitors must enter a shared password to access the storefront. On success, a session is created (JWT in HTTP-only cookie) and a server-side cart is initialized.

## Dependencies

None (standalone feature).

## Public API

| Export | Type | Description |
|--------|------|-------------|
| `GateForm` | Component | Client component with password input and "Remember Me" |
| `verifyPassword` | Server Action | Validates password, creates session + cart |
| `GateFormData` | Type | Form input shape |
| `GateActionResult` | Type | Action response shape |
| `GATE_RATE_LIMIT` | Constant | Max attempts per minute (5) |
| `GATE_SESSION_DURATION` | Constant | Default session TTL (24h) |
| `GATE_REMEMBER_DURATION` | Constant | Extended session TTL (30d) |

## Security

- Rate limited: 5 attempts per minute per IP
- Password hashed with bcrypt in SiteSettings
- Session stored as JWT in HTTP-only, Secure, SameSite=Lax cookie
- Security enforced via DAL `verifySession()`, NOT middleware
- Middleware is UX-only (redirect to /gate)

## Files

```
src/features/gate/
├── README.md              # This file
├── feature.config.ts      # Feature metadata
├── index.ts               # Public API
├── types.ts               # Type definitions
├── constants.ts           # Configuration constants
├── ui/
│   ├── GateForm.tsx       # Main gate form (client component)
│   └── _components/
│       └── GateError.tsx  # Private error display component
└── actions/
    └── verify-password.action.ts  # Server action
```
