# Feature Specification: Phase 2 Cart & Checkout

**Feature Branch**: `002-cart-checkout`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Phase 2 Core Features: Server-side relational cart (carts + cart_items tables), cart actions (add/update/remove/clear), cart UI with Zustand for drawer state only, live price change detection, inactive item handling, cart cleanup cron, orders module with atomic stock decrement, checkout form with COD, order confirmation page, order tracking by number or phone"

## Clarifications

### Session 2026-02-20

- **Q**: Should order confirmation page be accessible without authentication? → **A**: Yes, order confirmation and tracking pages are public (no gate required) since they only display order number and status, no sensitive customer data beyond what they already provided
- **Q**: What happens to cart when session expires but user returns? → **A**: New session created, cart is lost (abandoned cart). 24-hour expiration from last activity extends on each cart action.
- **Q**: What should the user experience be during cart operations (add, update, remove)? → **A**: Loading spinner on affected item, disable actions during operation. No optimistic updates - wait for server response.
- **Q**: Is there a maximum number of distinct items (different variants) a cart can contain? → **A**: Maximum 50 distinct items per cart.
- **Q**: When a user tries to add a new variant to cart but already has 50 distinct items, what should happen? → **A**: Show error: "Cart is full (50 items max). Remove items to add more."
- **Q**: Should there be rate limiting on order tracking lookups to prevent abuse? → **A**: Yes, rate limit: 10 lookups per minute per IP.
- **Q**: When someone accesses `/order-confirmation/[orderId]` with an invalid or non-existent orderId, what should happen? → **A**: Show "Order not found" message on the page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Items to Cart (Priority: P1)

As a customer, I want to add product variants to my cart so that I can collect items I intend to purchase.

**Why this priority**: Adding items to cart is the foundational action for any purchase flow. Without this capability, no checkout is possible.

**Independent Test**: Can be fully tested by visiting a product detail page, selecting a variant, clicking "Add to Cart", and verifying the item appears in the cart drawer.

**Acceptance Scenarios**:

1. **Given** I am on a product detail page with an active session, **When** I select a variant and click "Add to Cart", **Then** the item is added to my server-side cart and the cart badge shows the item count
2. **Given** I add the same variant twice, **When** I view my cart, **Then** the quantity is merged (not duplicated) and capped at 10
3. **Given** I try to add a variant with insufficient stock, **When** I submit the request, **Then** I see an error message showing available stock
4. **Given** I add an item to cart, **When** the add completes, **Then** `price_at_add` is stored for later price change detection

---

### User Story 2 - Manage Cart Contents (Priority: P1)

As a customer, I want to view and modify my cart contents so that I can adjust my order before checkout.

**Why this priority**: Cart management is essential for customers to review and modify their selections before committing to purchase.

**Independent Test**: Can be fully tested by opening the cart drawer, changing quantities, removing items, and verifying changes persist.

**Acceptance Scenarios**:

1. **Given** I have items in my cart, **When** I open the cart drawer, **Then** I see all items with current live prices, product names, and variant names
2. **Given** I view my cart, **When** an item's price has changed since I added it, **Then** I see a notification banner showing the old and new price
3. **Given** I view my cart, **When** an item is no longer available (inactive product or variant), **Then** the item is greyed out with "Unavailable" label and checkout is blocked until removed
4. **Given** I change an item's quantity, **When** I submit the update, **Then** quantity is updated (min 1, max 10) and cart total recalculates
5. **Given** I remove an item from cart, **When** the action completes, **Then** the item is removed and no longer appears in my cart

---

### User Story 3 - Complete Checkout (Priority: P1)

As a customer, I want to submit my order with my delivery information so that I can receive my products via Cash on Delivery.

**Why this priority**: Checkout is the revenue-generating action. Without it, the entire cart functionality has no business value.

**Independent Test**: Can be fully tested by adding items to cart, navigating to checkout, filling the form, submitting, and verifying order is created with correct status.

**Acceptance Scenarios**:

1. **Given** I have available items in my cart, **When** I navigate to checkout, **Then** I see a form with fields for name, phone, address, and notes
2. **Given** I submit the checkout form, **When** validation passes and stock is available, **Then** stock is atomically decremented, order is created with status "pending", and my cart is cleared
3. **Given** I submit the checkout form with an invalid phone number, **When** validation runs, **Then** I see an error requiring +1 US format
4. **Given** I am a bot that filled the honeypot field, **When** I submit, **Then** I receive a fake success response but no order is created
5. **Given** checkout succeeds, **When** I am redirected to order confirmation, **Then** I see my order number (VX-XXXXXX format) and a prompt to screenshot

---

### User Story 4 - Track Order Status (Priority: P2)

As a customer, I want to check my order status by order number or phone so that I know when to expect delivery.

**Why this priority**: Order tracking provides customer confidence post-purchase. Important but the sale is already complete.

**Independent Test**: Can be fully tested by creating an order, then visiting the track order page and searching by order number or phone.

**Acceptance Scenarios**:

1. **Given** I have an order number, **When** I enter it on the track order page, **Then** I see my order details with status timeline
2. **Given** I want to see all my orders, **When** I enter my phone number on the track order page, **Then** I see all orders associated with that phone
3. **Given** my order is pending, **When** I view it, **Then** I see "Pending" status with description that the admin will review
4. **Given** I enter an invalid order number, **When** I search, **Then** I see "Order not found" message

---

### User Story 5 - Cart Expiration & Cleanup (Priority: P3)

As the system, I want to automatically clean up expired carts so that the database doesn't accumulate abandoned cart data.

**Why this priority**: Operational maintenance. Critical for long-term system health but doesn't block customer functionality.

**Independent Test**: Can be fully tested by creating a cart, manually setting `expires_at` to past, running the cron endpoint, and verifying cart is deleted.

**Acceptance Scenarios**:

1. **Given** a cart's `expires_at` is in the past, **When** the cleanup cron runs, **Then** the cart and its items are deleted
2. **Given** I interact with my cart, **When** any cart action occurs, **Then** `expires_at` is extended to 24 hours from now
3. **Given** the cron endpoint receives a request without valid `CRON_SECRET`, **When** it processes, **Then** it returns 401 Unauthorized

---

### Edge Cases

| Scenario | System Behavior |
|----------|----------------|
| Stock becomes insufficient during checkout | Transaction rolls back, user sees "Some items are no longer available" with updated stock counts |
| Price changes between cart add and checkout | Live price used at checkout; `price_at_add` only for notification, not pricing |
| Variant deleted while in cart | Treated as inactive item - greyed out, must remove before checkout |
| Concurrent orders for same variant | PostgreSQL serializable isolation prevents race conditions; second order fails if stock exhausted |
| Order number collision (extremely rare) | System retries generation up to 3 times with new random suffix |
| Cart created but never modified for 24h | Automatically deleted by cron job |
| Checkout rate limit exceeded | Return 429 with "Too many requests, please wait" message |
| Invalid phone format submitted | Zod validation rejects with "Phone must be +1 US format (e.g., +15551234567)" |
| Honeypot field filled | Silent fake success returned, no error shown (don't reveal bot detection) |
| Cart at 50 items, user tries to add more | Show error: "Cart is full (50 items max). Remove items to add more." |
| Invalid or non-existent orderId on order confirmation page | Show "Order not found" message on the page |

## Requirements *(mandatory)*

### Functional Requirements

**Cart Collections**
- **FR-001**: System MUST create `carts` collection with UUID id, session_id (unique), expires_at, created_at, updated_at
- **FR-002**: System MUST create `cart_items` collection with id, cart_id (FK to carts), variant_id (FK to product_variants), quantity (1-10), price_at_add, added_at
- **FR-003**: System MUST enforce UNIQUE constraint on (cart_id, variant_id) to prevent duplicate variants per cart
- **FR-004**: System MUST enforce maximum of 50 distinct items (variants) per cart

**Cart Actions**
- **FR-005**: System MUST implement `add-to-cart.action.ts` that validates session, checks stock, creates/updates cart, upserts cart item
- **FR-006**: System MUST implement `update-quantity.action.ts` that validates quantity range (1-10), updates cart_item
- **FR-007**: System MUST implement `remove-item.action.ts` that deletes cart_item by id
- **FR-008**: System MUST implement `clear-cart.action.ts` that deletes all items for a cart
- **FR-009**: System MUST extend cart `expires_at` to 24h from now on every cart action
- **FR-010**: System MUST rate limit cart actions to 20 operations per minute per session

**Cart UI**
- **FR-011**: System MUST create CartDrawer component using shadcn/ui Sheet
- **FR-012**: System MUST create CartButton component showing item count badge
- **FR-013**: System MUST implement Zustand store for UI state only (isDrawerOpen, isLoading) - NO cart items in Zustand
- **FR-014**: System MUST create PriceChangeNotice component displaying old vs new price when detected
- **FR-015**: System MUST grey out inactive items and block checkout when any inactive item exists in cart
- **FR-016**: System MUST show loading spinner on affected cart item and disable all cart actions during server operations (no optimistic updates)

**Orders Collections**
- **FR-017**: System MUST create `orders` collection with UUID id, order_number (unique, VX-XXXXXX format), session_id, customer_name, customer_phone, delivery_address, notes, status, cancellation_reason, cancelled_by, cancelled_at, honeypot_field, total_amount, created_at, updated_at
- **FR-018**: System MUST create `order_items` collection with id, order_id (FK), variant_id, product_name (snapshot), variant_name (snapshot), quantity, unit_price (snapshot), total_price, created_at
- **FR-019**: System MUST enforce CHECK constraint: total_price = unit_price * quantity
- **FR-020**: System MUST enforce CHECK constraint: cancelled fields only populated when status = 'cancelled'

**Orders Module**
- **FR-021**: System MUST implement `order.service.ts` in modules/orders with createOrder, updateOrderStatus, cancelOrder, getOrderByNumber, getOrdersByPhone, generateOrderNumber
- **FR-022**: System MUST implement `stock.service.ts` in modules/orders with decrementStock (atomic, within transaction), returnStock (on cancellation)
- **FR-023**: System MUST generate order numbers using format VX-XXXXXX with charset 23456789ABCDEFGHJKMNPQRSTUVWXYZ (30 chars, no ambiguous 0/O/1/I/L)
- **FR-024**: System MUST validate order status transitions: pending→processing, pending→cancelled, processing→completed, processing→cancelled only

**Checkout**
- **FR-025**: System MUST implement `process-checkout.action.ts` with atomic transaction (validate → decrement stock → create order → create order_items → delete cart)
- **FR-026**: System MUST validate checkout input with Zod: customerName (2-255 chars), customerPhone (+1 US format regex), deliveryAddress (10-500 chars), notes (max 1000 chars optional), honeypotField (max 0 chars)
- **FR-027**: System MUST rate limit checkout to 3 attempts per minute per session
- **FR-028**: System MUST silently reject honeypot-filled submissions with fake success (no error revealed)
- **FR-029**: System MUST create CheckoutForm component with customer fields, order summary, COD disclaimer

**Order Confirmation & Tracking**
- **FR-030**: System MUST create order confirmation page at `/order-confirmation/[orderId]` showing order number prominently with screenshot prompt
- **FR-031**: System MUST create track order page at `/track-order` with form for order number OR phone lookup
- **FR-032**: System MUST create StatusTimeline component showing pending → processing → completed visual
- **FR-033**: System MUST implement `track-order.action.ts` for lookup by order number
- **FR-034**: System MUST implement `lookup-orders.action.ts` for lookup by phone number
- **FR-035**: System MUST rate limit order tracking lookups to 10 per minute per IP to prevent enumeration attacks

**Cart Cleanup Cron**
- **FR-036**: System MUST create cron endpoint at `/api/cron/cleanup-carts` that deletes expired carts
- **FR-037**: System MUST authenticate cron endpoint with Bearer token matching `CRON_SECRET` env var
- **FR-038**: System MUST configure cron schedule in `vercel.json` (every 6 hours: `0 */6 * * *`)

### Key Entities

- **Cart**: Server-side session-linked cart. UUID id for security. Linked to session_id. Expires 24h from last activity. One cart per session. Maximum 50 distinct items (variants).

- **CartItem**: Individual items in cart. Links to Cart and ProductVariant. Stores `price_at_add` for change detection. Quantity capped at 10. Unique per (cart_id, variant_id).

- **Order**: Customer order record. UUID id, human-readable order_number (VX-XXXXXX). Status: pending → processing → completed OR cancelled. Snapshots customer info at order time. Total amount reflects live prices at checkout.

- **OrderItem**: Line items in order. Snapshots product_name, variant_name, unit_price at order time (never changes). Computed total_price = unit_price × quantity enforced by DB constraint.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Add to cart action completes in <500ms including database write
- **SC-002**: Cart drawer opens within 100ms (data already loaded server-side)
- **SC-003**: Price change detection correctly identifies 100% of price changes between add and view
- **SC-004**: Checkout completes in <2 seconds including atomic stock decrement
- **SC-005**: Order number generation succeeds on first attempt >99.99% of the time
- **SC-006**: Stock race conditions result in proper error handling (no overselling) in 100% of concurrent order scenarios
- **SC-007**: Cart cleanup cron processes 1000 expired carts in <30 seconds
- **SC-008**: Order tracking by order number returns results in <500ms
- **SC-009**: Phone lookup returns all matching orders in <1 second
- **SC-010**: Rate limiting blocks 100% of requests exceeding thresholds
- **SC-011**: Honeypot field catches bots with 0% false negatives (empty field = human, filled = bot)

## Assumptions

- **Session Management**: Gate session provides valid session_id for cart linkage
- **Stock Model**: Direct Decrement model (no reserved_quantity field)
- **Payment**: COD only - no payment gateway integration needed
- **Currency**: USD only, 2 decimal places, formatted with `$` symbol
- **Phone Format**: US +1 format only (e.g., +15551234567)
- **Order Number Prefix**: Default "VX" prefix, configurable in future
- **Cart Expiration**: 24 hours from last activity (not creation)
- **Max Quantity**: 10 units per variant per cart
- **Max Distinct Items**: 50 different variants maximum per cart

## Dependencies

- Phase 1 (001-foundation-setup) MUST be complete
- Session management from `core/auth/`
- Product variants collection with stock_quantity field
- DAL pattern for session verification
- Payload v3 transaction API for atomic operations
- Neon PostgreSQL with serializable isolation level

## Out of Scope

- Payment gateway integration (COD only)
- Reserved stock model (Direct Decrement only)
- Cart persistence across sessions (session-bound)
- Guest checkout (requires gate session)
- Order editing after creation
- Partial order cancellations
- Order refunds
- Invoice generation
- Email notifications
- SMS notifications
- Admin order management UI (Phase 3)
- Low stock alerts (Phase 3)
