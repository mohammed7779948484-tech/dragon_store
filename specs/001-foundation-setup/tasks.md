# Tasks: Phase 1 Foundation

**Branch**: `001-foundation-setup`  
**Created**: 2026-02-17  
**Status**: Ready for Implementation  
**Input**: specs/001-foundation-setup/spec.md, impl-plan.md

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js 15 + Payload CMS v3 project with all dependencies

**Prerequisites**: None

- [x] T001 Create project directory structure (cross-platform):
  ```bash
  # Create all directories (works on Windows, macOS, Linux)
  mkdir -p src/app/\(payload\)/admin
  mkdir -p src/app/\(storefront\)/gate
  mkdir -p src/app/api/cron
  mkdir -p src/widgets/{header,footer,product-grid,whatsapp-button}
  mkdir -p src/features/{_registry,gate,products,cart,checkout,order-tracking}
  mkdir -p src/modules/catalog
  mkdir -p src/core/{auth,config,errors,logger,rate-limit,db}
  mkdir -p src/payload/{collections,globals,hooks,access,admin}
  mkdir -p src/shared/{ui,lib,hooks,config,types}
  ```
- [x] T002 [P] Initialize package.json with Next.js 15, React 19, and TypeScript dependencies in `package.json`
- [x] T003 [P] Install Payload CMS v3 with `@payloadcms/next` and `@payloadcms/db-postgres` in `package.json`
- [x] T004 [P] Install UI dependencies: Tailwind CSS, shadcn/ui, Radix UI primitives in `package.json`
- [x] T005 [P] Install utility libraries: Zod, bcrypt, jose, lru-cache in `package.json`
- [x] T006 [P] Install monitoring: @sentry/nextjs in `package.json`
- [x] T007 [P] Install media: payload-cloudinary plugin in `package.json`
- [x] T008 [P] Install testing: Vitest, @testing-library/react, Playwright in `package.json`
- [x] T009 Configure TypeScript strict mode in `tsconfig.json`
- [x] T010 Configure Tailwind CSS with brand colors in `tailwind.config.ts`
- [x] T011 Configure Next.js 15 with Payload in `next.config.ts`
- [x] T012 Create .env.example with all required variables in `.env.example`
- [x] T013 Create .env.local template in `.env.local`

**Checkpoint**: `npm install` completes without errors

---

## Phase 2: Foundational Infrastructure

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T014 [P] Implement AppError class for hierarchical error handling in `src/core/errors/app-error.ts`
- [x] T015 [P] Implement Logger with Sentry integration in `src/core/logger/index.ts`
- [x] T016 Implement rate limiter using LRU cache in `src/core/rate-limit/index.ts`
- [x] T017 Implement Zod environment validation schema in `src/core/config/env.ts`
- [x] T018 Implement app configuration in `src/core/config/app.config.ts`
- [x] T019 Implement Payload client wrapper in `src/lib/payload.ts`
- [x] T020 Implement JWT encryption utilities in `src/core/auth/encryption.ts`
- [x] T021 Implement DAL session verification with verifySession() in `src/core/auth/session.ts`
- [x] T022 Implement createSession and destroySession functions in `src/core/auth/session.ts`
- [x] T023 Configure Sentry client-side in `sentry.client.config.ts`
- [x] T024 Configure Sentry server-side in `sentry.server.config.ts`
- [x] T025 Create global CSS styles in `src/app/globals.css`
- [x] T026 Create root layout with providers in `src/app/layout.tsx`
- [x] T027 Create providers wrapper in `src/app/providers.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Access to Management Panel (Priority: P1) 🎯 MVP

**Goal**: Enable super admin login to Payload CMS admin panel with role-based access control

**Independent Test**: Navigate to `/admin`, login with seeded credentials, verify dashboard and all collections are accessible

### Models & Collections for User Story 1

- [x] T028 [P] Create Users collection with role field in `src/payload/collections/users.ts`
- [x] T029 [P] Create access control helpers in `src/payload/access/is-admin.ts`
- [x] T030 [P] Create super-admin access control in `src/payload/access/is-super-admin.ts`
- [x] T031 Create SiteSettings global configuration in `src/payload/globals/site-settings.ts`

### Admin Panel Configuration for User Story 1

- [x] T032 Configure Payload admin panel in `src/payload/admin/views/Dashboard.tsx`
- [x] T033 Create admin Icon component in `src/payload/admin/graphics/Icon.tsx`
- [x] T034 Create admin Logo component in `src/payload/admin/graphics/Logo.tsx`

### Seed Script for User Story 1

- [x] T035 Create seed script for Super Admin in `scripts/seed-admin.ts`
- [x] T036 Create seed logic for SiteSettings initialization in `scripts/seed-admin.ts`

### Admin Routes for User Story 1

- [x] T037 Create Payload admin catch-all route in `src/app/(payload)/admin/[[...segments]]/page.tsx`

**Checkpoint**: Admin can log in to `/admin` within 5 seconds, all collections visible

---

## Phase 4: User Story 2 - Store Access via Password Gate (Priority: P1) 🎯 MVP

**Goal**: Implement password gate protecting storefront with session-based authentication

**Independent Test**: Visit `/`, get redirected to `/gate`, enter password, gain access to home page

### Feature Infrastructure for User Story 2

- [x] T038 [P] Create feature registry types in `src/features/_registry/types.ts`
- [x] T039 [P] Create feature registry index in `src/features/_registry/index.ts`
- [x] T040 Create gate feature configuration in `src/features/gate/feature.config.ts`
- [x] T041 Create gate feature types in `src/features/gate/types.ts`
- [x] T042 Create gate feature constants in `src/features/gate/constants.ts`
- [x] T043 Create gate feature index exports in `src/features/gate/index.ts`
- [x] T044 Create gate feature README in `src/features/gate/README.md`

### Session & Cart Schema for User Story 2

- [x] T045 [P] Create Carts collection schema in `src/features/cart/db/schema.ts`
- [x] T046 [P] Create CartItems collection schema in `src/features/cart/db/schema.ts`

### Server Action for User Story 2

- [x] T047 Implement verify-password server action in `src/features/gate/actions/verify-password.action.ts`

### UI Components for User Story 2

- [x] T048 [P] Create GateError component in `src/features/gate/ui/_components/GateError.tsx`
- [x] T049 Create GateForm component in `src/features/gate/ui/GateForm.tsx`

### Middleware for User Story 2

- [x] T050 Implement middleware for UX redirects in `src/middleware.ts` (⚠️ Constitution: CVE-2025-29927 - middleware bypass possible. Use ONLY for UX redirects, NEVER for security. Security handled in DAL via verifySession())

### Gate Page for User Story 2

- [x] T051 Create gate page in `src/app/(storefront)/gate/page.tsx`

**Checkpoint**: Gate page loads < 2 seconds, password verify < 500ms, session creation < 200ms, 100% unauth access blocked

---

## Phase 5: User Story 3 - Product Data Management (Priority: P2)

**Goal**: Enable admin to create and manage brands, categories, products, and variants

**Independent Test**: Create brand, category, product with variants in admin, verify they appear in storefront

### Collections for User Story 3

- [x] T052 [P] Create Brands collection in `src/payload/collections/brands.ts`
- [x] T053 [P] Create Categories collection with parent relationship in `src/payload/collections/categories.ts`
- [x] T054 [P] Create Products collection in `src/payload/collections/products.ts`
- [x] T055 [P] Create ProductVariants collection in `src/payload/collections/product-variants.ts`
- [x] T056 [P] Create Media collection with Cloudinary in `src/payload/collections/media.ts`

### Hooks for User Story 3

- [x] T057 [P] Implement generate-slug hook in `src/payload/hooks/before-change/generate-slug.ts`
- [x] T058 [P] Implement validate-parent-depth hook in `src/payload/hooks/before-change/validate-parent-depth.ts`
- [x] T059 [P] Implement revalidate-cache hook in `src/payload/hooks/after-change/revalidate-cache.ts`

### Payload Configuration for User Story 3

- [x] T060 Assemble Payload config with all collections in `src/payload/payload.config.ts`

### Catalog Module for User Story 3

- [x] T061 [P] Create catalog module types in `src/modules/catalog/types.ts`
- [x] T062 [P] Create catalog module index exports in `src/modules/catalog/index.ts`
- [x] T063 Create product service in `src/modules/catalog/services/product.service.ts`
- [x] T064 Create category service in `src/modules/catalog/services/category.service.ts`
- [x] T065 Create brand service in `src/modules/catalog/services/brand.service.ts`

### Product Feature for User Story 3

- [x] T066 Create products feature configuration in `src/features/products/feature.config.ts`
- [x] T067 Create products feature types in `src/features/products/types.ts`
- [x] T068 Create products feature constants in `src/features/products/constants.ts`
- [x] T069 Create products feature README in `src/features/products/README.md`
- [x] T070 [P] Create ProductCard component in `src/features/products/ui/ProductCard.tsx`
- [x] T071 [P] Create ProductDetail component in `src/features/products/ui/ProductDetail.tsx`
- [x] T072 [P] Create VariantSelector component in `src/features/products/ui/VariantSelector.tsx`
- [x] T073 [P] Create BrandCard component in `src/features/products/ui/BrandCard.tsx`
- [x] T074 [P] Create BrandGrid component in `src/features/products/ui/BrandGrid.tsx`
- [x] T075 [P] Create CategoryCard component in `src/features/products/ui/CategoryCard.tsx`
- [x] T076 [P] Create CategoryGrid component in `src/features/products/ui/CategoryGrid.tsx`

### Widgets for User Story 3

- [x] T077 Create Header widget in `src/widgets/header/Header.tsx`
- [x] T078 Create Footer widget in `src/widgets/footer/Footer.tsx`
- [x] T079 Create ProductGrid widget in `src/widgets/product-grid/ProductGrid.tsx`
- [x] T080 Create WhatsAppButton widget in `src/widgets/whatsapp-button/WhatsAppButton.tsx`

### Storefront Pages for User Story 3

- [x] T081 Create storefront layout in `src/app/(storefront)/layout.tsx`
- [x] T082 Create home page with grids in `src/app/(storefront)/page.tsx`
- [x] T083 Create brand detail page in `src/app/(storefront)/brands/[slug]/page.tsx`
- [x] T084 Create category detail page in `src/app/(storefront)/categories/[slug]/page.tsx`
- [x] T085 Create product detail page in `src/app/(storefront)/products/[slug]/page.tsx`
- [x] T086 Create products listing page in `src/app/(storefront)/products/page.tsx`

**Checkpoint**: Admin can create products/categories/brands, they appear in storefront, Cloudinary uploads work

---

## Phase 6: User Story 4 - Site Configuration Management (Priority: P3)

**Goal**: Enable super admin to manage site-wide settings (gate password, contact info)

**Independent Test**: Change gate password in SiteSettings, verify new password required on next gate access

### Site Settings Already Implemented

*Note: SiteSettings global created in Phase 4 (User Story 1)*

### Admin Components for User Story 4

- [x] T087 [P] Create OrderStatusBadge admin component in `src/payload/admin/components/OrderStatusBadge.tsx`
- [x] T088 [P] Create StockIndicator admin component in `src/payload/admin/components/StockIndicator.tsx`
- [x] T089 [P] Create QuickEditStock admin component in `src/payload/admin/components/QuickEditStock.tsx`

### Health Check for User Story 4

- [x] T090 Create health check API endpoint in `src/app/api/health/route.ts`

**Checkpoint**: Super admin can edit gate password in SiteSettings, changes take effect immediately

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance, documentation, and final validation

### Testing

- [x] T091 [P] Create unit test for session module in `src/core/auth/session.test.ts`
- [x] T092 [P] Create unit test for rate limiter in `src/core/rate-limit/index.test.ts`
- [x] T093 [P] Create unit test for verify-password action in `src/features/gate/actions/verify-password.action.test.ts`
- [x] T094 [P] Create integration test for product service in `src/modules/catalog/services/product.service.test.ts`
- [x] T095 [P] Create E2E test for gate flow in `tests/e2e/gate.spec.ts`
- [x] T096 [P] Create E2E test for admin access in `tests/e2e/admin-access.spec.ts`

### Documentation

- [x] T097 Create catalog module README in `src/modules/catalog/README.md`
- [x] T098 Create core module README in `src/core/README.md`
- [x] T099 Create shared utilities README in `src/shared/README.md`

### Validation

- [x] T100 Run quickstart.md validation steps
- [x] T101 Verify WCAG 2.1 AA compliance with automated audit
- [x] T102 Verify FSD architecture (no cross-layer imports)
- [x] T103 Verify TypeScript strict mode (zero errors)
- [x] T104 Verify all success criteria met

**Checkpoint**: All tests passing, >80% coverage, WCAG 2.1 AA compliant, TypeScript strict, documentation complete

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← CRITICAL BLOCKER
    ↓
    ├──────┬──────┬──────┐
    ↓      ↓      ↓      ↓
  US1    US2    US3    US4
(P1)    (P1)    (P2)    (P3)
    └──────┴──────┴──────┘
              ↓
       Phase 7 (Polish)
```

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - Admin access is independent
- **User Story 2 (P1)**: No dependencies - Gate is independent  
- **User Story 3 (P2)**: No dependencies - Product management is independent
- **User Story 4 (P3)**: No dependencies - Site settings is independent

**All user stories can be worked on in parallel after Phase 2 completion**

### Within Each User Story

- Collections/Models → Services → UI Components → Pages
- Core implementation before integration
- Story complete when all acceptance criteria met

---

## Parallel Opportunities

### Parallel by Phase

**Phase 1 (Setup) - All tasks can run in parallel**:
```bash
# Install all dependency groups simultaneously
T002 through T008 can run in parallel (different packages)
T009 through T013 can run in parallel (different config files)
```

**Phase 2 (Foundational) - Most tasks can run in parallel**:
```bash
# Core infrastructure
T014 through T016 (different modules: errors, logger, rate-limit)
T017 through T018 (different configs)
T019 through T022 (different auth components)
T023 through T027 (different setup files)
```

### Parallel by User Story

Once Phase 2 completes, ALL user stories can proceed in parallel:

```bash
# Developer A: User Story 1 (Admin Access)
T028 through T037

# Developer B: User Story 2 (Password Gate)  
T038 through T051

# Developer C: User Story 3 (Product Management)
T052 through T086

# Developer D: User Story 4 (Site Settings)
T087 through T090
```

### Within User Story 3 (Example)

```bash
# Models in parallel
T052 through T056 (different collections)

# Hooks in parallel
T057 through T059 (different hooks)

# Services in parallel  
T063 through T065 (different services)

# UI components in parallel
T070 through T076 (different components)

# Pages in parallel
T082 through T086 (different routes)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

**Recommended approach**: Implement P1 stories first for working foundation

1. **Phase 1**: Setup (T001-T013)
2. **Phase 2**: Foundational (T014-T027)
3. **Phase 3**: User Story 1 - Admin Access (T028-T037)
4. **Phase 4**: User Story 2 - Password Gate (T038-T051)
5. **STOP and VALIDATE**: Test admin login and gate access
6. **Deploy/Demo**: Working foundation ready!

**At this point you have**:
- Admin panel accessible
- Password gate protecting site
- Super admin can log in
- SiteSettings configurable
- Foundation ready for Phase 2 features (cart, checkout)

### Incremental Delivery (All Stories)

1. Complete Phase 1 + Phase 2 → Foundation ready
2. Add User Story 1 (Admin) → Test independently → Deploy/Demo
3. Add User Story 2 (Gate) → Test independently → Deploy/Demo
4. Add User Story 3 (Products) → Test independently → Deploy/Demo
5. Add User Story 4 (Settings) → Test independently → Deploy/Demo
6. Phase 7 (Polish) → Final validation → Production ready

Each story adds value without breaking previous stories

### Full Parallel Team Strategy

With 4 developers:

**Sprint 1**: All developers complete Phase 1 + Phase 2 together

**Sprint 2** (parallel):
- Developer A: T028-T037 (User Story 1)
- Developer B: T038-T051 (User Story 2)
- Developer C: T052-T086 (User Story 3)
- Developer D: T087-T090 (User Story 4)

**Sprint 3**: All developers complete Phase 7 together

---

## Task Statistics

| Category | Count | Parallel Tasks |
|----------|-------|----------------|
| Phase 1 (Setup) | 13 | 11 |
| Phase 2 (Foundational) | 14 | 13 |
| Phase 3 (US1 - Admin) | 10 | 8 |
| Phase 4 (US2 - Gate) | 14 | 10 |
| Phase 5 (US3 - Products) | 35 | 28 |
| Phase 6 (US4 - Settings) | 4 | 3 |
| Phase 7 (Polish) | 14 | 10 |
| **Total** | **104** | **83** |

**Parallelization Rate**: 80% (83 of 104 tasks can run in parallel)

**Estimated Duration**:
- Solo developer (sequential): 15-20 days
- 2 developers (stories parallel): 8-10 days
- 4 developers (full parallel): 5-7 days

---

## Success Criteria Verification

| Criterion | Tasks | Owner Phase |
|-----------|-------|-------------|
| SC-001: Admin login < 5s | T028-T037 | US1 |
| SC-002: Gate page < 2s | T047-T051 | US2 |
| SC-003: Password verify < 500ms | T047 | US2 |
| SC-004: Session creation < 200ms | T021-T022 | US2 |
| SC-005: 100% unauth blocking | T050, T047 | US2 |
| SC-006: Media upload >99%, <5s | T056 | US3 |
| SC-007: Migrations without data loss | T060 | US3 |
| SC-008: FSD architecture enforced | All phases | All |
| SC-009: 100% error capture | T015, T023-T024 | Phase 2 |
| SC-010: Rate limiting < 50ms | T016 | Phase 2 |
| SC-011: Seed script < 3s | T035-T036 | US1 |
| SC-012: Scale targets (500 products, 50 users) | All | All |
| SC-013: WCAG 2.1 AA | T048-T049, T070-T076 | US2, US3 |

---

## Notes

- **Tests are OPTIONAL**: Test tasks (T091-T096) included but not required for MVP
- **Each user story independently completable**: Can stop after any story and have working functionality
- **Clear file paths**: Every task includes exact file path for implementation
- **No cross-story dependencies**: Stories don't block each other after Phase 2
- **Constitution compliance**: All tasks follow FSD, DAL pattern, file naming conventions
- **Ready for /speckit.implement**: Each task is specific enough for LLM execution

---

**Next Step**: Run `/speckit.implement` to begin executing tasks
