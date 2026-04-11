# Shared Utilities

## Purpose

Lowest layer in the FSD architecture. Contains dumb UI primitives, generic utilities, custom hooks, shared configuration, and shared types. No business logic — only reusable building blocks.

## Dependencies

- External libraries only (React, clsx, tailwind-merge, etc.)
- **CANNOT** import from any internal layer (core, modules, features, widgets, app)

## Structure

```
src/shared/
├── ui/                    # shadcn/ui primitives + custom UI components
│   ├── button.tsx         # Button variants (shadcn/ui)
│   ├── checkbox.tsx       # Checkbox (shadcn/ui)
│   ├── input.tsx          # Text input (shadcn/ui)
│   ├── label.tsx          # Form label (shadcn/ui)
│   └── breadcrumb.tsx     # Breadcrumb navigation (custom)
├── lib/                   # Generic utilities
│   └── cn.ts              # cn() helper — clsx + tailwind-merge
├── hooks/                 # Generic React hooks
│   └── (use-media-query, use-debounce, etc.)
├── config/                # Shared constants
│   └── (site-wide config values)
└── types/                 # Shared TypeScript types
    └── (common interfaces, utility types)
```

## Key Exports

| Export | Module | Description |
|--------|--------|-------------|
| `Button` | `ui/button` | shadcn/ui button with variants (default, destructive, outline, etc.) |
| `Input` | `ui/input` | shadcn/ui text input |
| `Checkbox` | `ui/checkbox` | shadcn/ui checkbox |
| `Label` | `ui/label` | shadcn/ui form label |
| `Breadcrumb` | `ui/breadcrumb` | Generic breadcrumb navigation with chevron separators |
| `cn()` | `lib/cn` | Class name merge utility (clsx + tailwind-merge) |

## Rules

- **Dumb UI only**: No business logic, no data fetching, no state management
- **External imports only**: Cannot import from core/, modules/, features/, widgets/, or app/
- **No global state**: State management lives in `features/[name]/logic/`
- **Generic & reusable**: Components must be feature-agnostic
- **Tailwind CSS only**: No inline styles, CSS modules, or styled-components
