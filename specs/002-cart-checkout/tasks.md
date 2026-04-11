# Tasks: Phase 2 Cart & Checkout

**Input**: Design documents from `/specs/002-cart-checkout/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-spec.md

**Tests**: Not explicitly requested - tests omitted per spec.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/` at repository root
- FSD architecture: `src/features/`, `src/modules/`, `src/app/`, etc.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Register new collections and configure cron

- [x] T001 Create orders module constants in src/modules/orders/constants.ts
- [x] T002 [P] Create orders module types in src/modules/orders/types.ts
- [x] T003 [P] Create orders module index.ts export in src/modules/orders/index.ts
- [x] T004 Create orders module README.md in src/modules/orders/README.md
- [x] T005 Create cart feature constants in src/features/cart/constants.ts
- [x] T006 [P] Create cart feature types in src/features/cart/types.ts
- [x] T007 Create checkout feature constants in src/features/checkout/constants.ts
- [x] T008 [P] Create checkout feature types in src/features/checkout/types.ts
- [x] T009 Create order-tracking feature constants in src/features/order-tracking/constants.ts
- [x] T010 [P] Create order-tracking feature types in src/features/order-tracking/types.ts
- [x] T011 Configure vercel.json cron schedule for cart cleanup

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database collections and shared module services that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Orders Module Services

- [x] T012 Create checkout validator (Zod schemas) in src/modules/orders/validators/validate-checkout.ts
- [x] T013 Create stock service with decrementStock and returnStock in src/modules/orders/services/stock.service.ts
- [x] T014 Create order service with createOrder, generateOrderNumber, status validation in src/modules/orders/services/order.service.ts

### Cart Collections

- [x] T015 Create carts collection schema in src/features/cart/db/schema.ts
- [x] T016 Create cart_items collection schema in src/features/cart/db/schema.ts (same file)
- [x] T017 Register Carts and CartItems collections in src/payload/payload.config.ts
- [x] T018 Create cart queries (getCartBySession, getCartItems) in src/features/cart/db/queries.ts
- [x] T019 Create cart mutations (createCart, addItemToCart, updateCartItem, removeCartItem, clearCart, extendExpiration) in src/features/cart/db/mutations.ts

### Checkout Collections

- [x] T020 Create orders collection schema in src/features/checkout/db/schema.ts
- [x] T021 Create order_items collection schema in src/features/checkout/db/schema.ts (same file)
- [x] T022 Register Orders and OrderItems collections in src/payload/payload.config.ts
- [x] T023 Create order queries (getOrderById, getOrderByNumber, getOrdersByPhone) in src/features/checkout/db/queries.ts
- [x] T024 Create order mutations (createOrder, createOrderItem) in src/features/checkout/db/mutations.ts

### Cart UI State

- [x] T025 Create Zustand store for cart UI state (isDrawerOpen, isLoading) in src/features/cart/logic/use-cart.ts

### Feature Registration

- [x] T026 Register cart feature in src/features/_registry/index.ts
- [x] T027 Register checkout feature in src/features/_registry/index.ts
- [x] T028 Register order-tracking feature in src/features/_registry/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add Items to Cart (Priority: P1) 🎯 MVP

**Goal**: Customers can add product variants to their server-side cart

**Independent Test**: Visit product detail page, select variant, click "Add to Cart", verify item appears in cart drawer with correct quantity and price

### Implementation for User Story 1

- [x] T029 [P] [US1] Create CartDrawer component in src/features/cart/ui/CartDrawer.tsx
- [x] T030 [P] [US1] Create CartButton component with badge in src/features/cart/ui/CartButton.tsx
- [x] T031 [P] [US1] Create CartItem component in src/features/cart/ui/_components/CartItem.tsx
- [x] T032 [P] [US1] Create CartSummary component in src/features/cart/ui/_components/CartSummary.tsx
- [x] T033 [P] [US1] Create EmptyCart component in src/features/cart/ui/_components/EmptyCart.tsx
- [x] T034 [US1] Implement add-to-cart server action in src/features/cart/actions/add-to-cart.action.ts
- [x] T035 [US1] Create cart feature index.ts exports in src/features/cart/index.ts
- [x] T036 [US1] Create cart feature.config.ts in src/features/cart/feature.config.ts
- [x] T037 [US1] Create cart feature README.md in src/features/cart/README.md
- [x] T038 [US1] Update Header widget to include CartButton in src/widgets/header/Header.tsx
- [x] T039 [US1] Create cart page at src/app/(storefront)/cart/page.tsx

**Checkpoint**: User Story 1 complete - customers can add items to cart

---

## Phase 4: User Story 2 - Manage Cart Contents (Priority: P1)

**Goal**: Customers can view and modify cart contents with price change detection

**Independent Test**: Open cart drawer, see items with live prices, change quantity, remove items, verify changes persist on page refresh

### Implementation for User Story 2

- [x] T040 [P] [US2] Create PriceChangeNotice component in src/features/cart/ui/_components/PriceChangeNotice.tsx
- [x] T041 [US2] Implement update-quantity server action in src/features/cart/actions/update-quantity.action.ts
- [x] T042 [US2] Implement remove-item server action in src/features/cart/actions/remove-item.action.ts
- [x] T043 [US2] Implement clear-cart server action in src/features/cart/actions/clear-cart.action.ts
- [x] T044 [US2] Add loading spinner and disabled state handling to CartItem in src/features/cart/ui/_components/CartItem.tsx
- [x] T045 [US2] Integrate PriceChangeNotice into CartDrawer in src/features/cart/ui/CartDrawer.tsx
- [x] T046 [US2] Add inactive item detection and greyed-out styling in src/features/cart/ui/_components/CartItem.tsx

**Checkpoint**: User Story 2 complete - full cart management with price change detection

---

## Phase 5: User Story 3 - Complete Checkout (Priority: P1)

**Goal**: Customers can submit orders with atomic stock decrement and COD payment

**Independent Test**: Add items to cart, navigate to checkout, fill form, submit, verify order created with "pending" status, stock decremented, cart cleared

### Implementation for User Story 3

- [x] T047 [P] [US3] Create CustomerFields component in src/features/checkout/ui/_components/CustomerFields.tsx
- [x] T048 [P] [US3] Create OrderSummary component in src/features/checkout/ui/_components/OrderSummary.tsx
- [x] T049 [P] [US3] Create CodDisclaimer component in src/features/checkout/ui/_components/CodDisclaimer.tsx
- [x] T050 [US3] Create CheckoutForm component in src/features/checkout/ui/CheckoutForm.tsx
- [x] T051 [US3] Implement process-checkout server action with atomic transaction in src/features/checkout/actions/process-checkout.action.ts
- [x] T052 [US3] Create checkout feature index.ts exports in src/features/checkout/index.ts
- [x] T053 [US3] Create checkout feature.config.ts in src/features/checkout/feature.config.ts
- [x] T054 [US3] Create checkout feature README.md in src/features/checkout/README.md
- [x] T055 [US3] Create checkout page at src/app/(storefront)/checkout/page.tsx
- [x] T056 [US3] Create OrderConfirmation component in src/features/checkout/ui/OrderConfirmation.tsx
- [x] T057 [US3] Create order confirmation page at src/app/(storefront)/order-confirmation/[orderId]/page.tsx

**Checkpoint**: User Story 3 complete - full checkout flow with order creation

---

## Phase 6: User Story 4 - Track Order Status (Priority: P2)

**Goal**: Customers can look up orders by order number or phone number

**Independent Test**: Create an order, visit track order page, search by order number or phone, see order details with status timeline

### Implementation for User Story 4

- [x] T058 [P] [US4] Create StatusTimeline component in src/features/order-tracking/ui/_components/StatusTimeline.tsx
- [x] T059 [P] [US4] Create OrderStatus component in src/features/order-tracking/ui/OrderStatus.tsx
- [x] T060 [US4] Create TrackOrderForm component in src/features/order-tracking/ui/TrackOrderForm.tsx
- [x] T061 [US4] Implement track-order server action in src/features/order-tracking/actions/track-order.action.ts
- [x] T062 [US4] Implement lookup-orders server action in src/features/order-tracking/actions/lookup-orders.action.ts
- [x] T063 [US4] Create order-tracking feature index.ts exports in src/features/order-tracking/index.ts
- [x] T064 [US4] Create order-tracking feature.config.ts in src/features/order-tracking/feature.config.ts
- [x] T065 [US4] Create order-tracking feature README.md in src/features/order-tracking/README.md
- [x] T066 [US4] Create track order page at src/app/(storefront)/track-order/page.tsx

**Checkpoint**: User Story 4 complete - order tracking functional

---

## Phase 7: User Story 5 - Cart Expiration & Cleanup (Priority: P3)

**Goal**: System automatically cleans up expired carts via cron job

**Independent Test**: Create cart, manually set expires_at to past, call cron endpoint with valid CRON_SECRET, verify cart deleted

### Implementation for User Story 5

- [ ] T067 [US5] Create cart cleanup cron route handler in src/app/api/cron/cleanup-carts/route.ts
- [ ] T068 [US5] Add cron secret validation to env schema in src/core/config/env.ts

**Checkpoint**: User Story 5 complete - automated cart cleanup

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and verification

- [ ] T069 Run TypeScript type checking to verify no errors
- [ ] T070 Run lint to verify code style compliance
- [ ] T071 Verify all collections appear in Payload admin panel
- [ ] T072 Test full user flow: gate → browse → cart → checkout → track
- [ ] T073 Update AGENTS.md with new technologies (Zustand)
- [ ] T074 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Add to Cart)**: Depends on Foundational only - No dependencies on other stories
- **US2 (Manage Cart)**: Depends on US1 for CartDrawer/CartButton components
- **US3 (Checkout)**: Depends on US1/US2 for cart data and orders module
- **US4 (Track Order)**: Depends on US3 for orders to exist, but independently testable
- **US5 (Cart Cleanup)**: Depends on US1 for carts to exist, but independently testable

### Within Each User Story

- Components can be built in parallel (marked [P])
- Server actions depend on db queries/mutations (in Foundational)
- Pages depend on components and actions

### Parallel Opportunities

Within Phase 1:
```
T001, T002, T003, T005, T006, T007, T008, T009, T010 can run in parallel
T004 depends on module structure
T011 independent
```

Within Phase 2:
```
T001-T004 (orders module) independent of T005-T010 (feature types)
T012-T014 (orders services) can run after T001-T004
T015-T019 (cart db) independent of T020-T024 (checkout db)
T025-T028 can run in parallel with db setup
```

Within User Story 1:
```
T029-T033 (components) can all run in parallel
T034-T039 sequential after components
```

---

## Parallel Example: User Story 1 Components

```bash
# Launch all US1 components in parallel:
Task: "Create CartDrawer component in src/features/cart/ui/CartDrawer.tsx"
Task: "Create CartButton component with badge in src/features/cart/ui/CartButton.tsx"
Task: "Create CartItem component in src/features/cart/ui/_components/CartItem.tsx"
Task: "Create CartSummary component in src/features/cart/ui/_components/CartSummary.tsx"
Task: "Create EmptyCart component in src/features/cart/ui/_components/EmptyCart.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Add to Cart)
4. Complete Phase 4: User Story 2 (Manage Cart)
5. Complete Phase 5: User Story 3 (Checkout)
6. **STOP and VALIDATE**: Test full purchase flow
7. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Add to cart works → Test independently
3. Add US2 → Cart management works → Test independently
4. Add US3 → Checkout works → Full MVP ready → Deploy
5. Add US4 → Order tracking works → Enhanced value
6. Add US5 → Cart cleanup automated → Operations complete
7. Polish → Production ready

---

## Task Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1: Setup | 11 | Constants, types, cron config |
| Phase 2: Foundational | 17 | Module services, collections, queries/mutations |
| Phase 3: US1 Add to Cart | 11 | Cart UI components, add-to-cart action |
| Phase 4: US2 Manage Cart | 7 | Cart actions, price change detection |
| Phase 5: US3 Checkout | 11 | Checkout form, process-checkout action |
| Phase 6: US4 Track Order | 9 | Order tracking UI and actions |
| Phase 7: US5 Cart Cleanup | 2 | Cron endpoint |
| Phase 8: Polish | 6 | Final verification |
| **Total** | **74** | |

---

## Notes

- [P] tasks = different files, no dependencies on other tasks in same phase
- [Story] label maps task to specific user story for traceability
- US1-US3 are P1 (MVP), US4 is P2, US5 is P3
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
