# Product Detail Architecture & Add-to-Cart Integration Reference
**Date:** 2026-02-21
**Architecture:** Feature-Sliced Design (FSD) with Next.js App Router (RSC)

## 1. Architectural Overview
This document serves as a comprehensive technical reference for the complete Product Details Page (PDP) architecture. It details the separation of Server Components (RSC) for SEO optimization and Client Components for interactivity (Image Gallery, Variant Selection, Quantity Steppers, and Cart Actions). 

A core principle observed here is **Strict FSD Isolation**: The `products` feature has zero dependencies on the `cart` feature. They are entirely decoupled, and the `cart` feature injects its behavior into the `products` layout exclusively at the Next.js App Router (Page) level.

---

## 2. Component Hierarchy & Data Flow

```text
Page: app/(storefront)/products/[slug]/page.tsx (Server)
 ├── Fetches Product Data (Payload Local API)
 └── Composes Features: <ProductDetail ActionComponent={AddToCartButton} />
      │
      └── Feature: products/ui/ProductDetail.tsx (Server)
           └── Thin Wrapper, passes parsed data down
                │
                └── products/ui/_components/ProductInteractive.tsx (Client)
                     ├── Manages: `selectedVariantId`, `activeImageIndex`
                     ├── Left Column: Dynamic Image Gallery (Main + Thumbnails)
                     └── Right Column: Header, Price, Stock, Description, and...
                          │
                          └── products/ui/VariantSelector.tsx (Client)
                               ├── Manages: `quantities` Record (per-variant)
                               └── Iterates over variants, rendering each as a card
                                    └── Injects: `ActionComponent` (AddToCartButton) inside each card
```

---

## 3. Component Deep Dives & Edge Cases

### 3.1 `ProductInteractive` (Unified State & Layout)
This component is the "Single Source of Truth" for the 2-column layout UI state.
- **Props Received:** `variants`, `totalStock`, `minPrice`, `maxPrice`, `unitLabel`, `imageUrl`, `productName`, `brandName`, `description`, `ActionComponent`.
- **State Management:**
  - `selectedVariantId`: Defaults to the first variant's ID on load. Triggers CSS updates across the child `VariantSelector` and drives the data calculations.
  - `activeImageIndex`: Tracks which thumbnail is currently viewed in the main gallery pane.
- **Dynamic Price Formatting:**
  - If a variant is selected: Shows exact variant price `CURRENCY_SYMBOL + variant.price`.
  - If no variant (fallback): Shows `minPrice`, formatted as "From [min]" if `minPrice !== maxPrice`.
- **Image Gallery Synchronization & Fallbacks:** 
  - The gallery strictly binds to `galleryImages`.
  - Fallback logic chain: `selectedVariant.images` → fallback to `product.imageUrl` → fallback to static `PLACEHOLDER_IMAGE`.
  - **Critical Reset Logic:** When `handleVariantSelect` fires, `setActiveImageIndex(0)` is explicitly called. This prevents the gallery from crashing if transitioning from a variant with 5 images to a variant with only 1 image.
- **Layout Structure:** Utilizes Tailwind CSS grid (`grid-cols-2` mapped via `gap-8`).

### 3.2 `VariantSelector` (Per-Variant Action Cards)
This component was designed to simulate modern advanced e-commerce UI by rendering variants not as simple pills, but as fully contained "mini product cards".
- **Selection State UI:** Active variants render with a green border (`border-green-600`), light green background tint, and a custom SVG checkmark indicator. Inactive variants use neutral hover states.
- **Local State (`quantities`):** Tracks quantities completely independently for every variant via a mapping object (`Record<number, number>`). This state is kept *local* to avoid unnecessarily re-rendering the heavy Image Gallery in the parent component when adjusting numbers.
- **Quantity Edge Cases Enforced:**
  - The stepper clamp relies on: `Math.max(1, Math.min(variant.stockQuantity, current + delta))`.
  - Decrement is disabled at `1`.
  - Increment is disabled at `variant.stockQuantity`.
- **Out of Stock UI Handling:** If `variant.stockQuantity === 0`, the entire bottom row (Stepper + ActionComponent) is destroyed and replaced with a red "Sold Out" badge.

### 3.3 `AddToCartButton` (Integration Hub)
Created entirely within the `cart` feature (`src/features/cart/ui/AddToCartButton.tsx`). It is a self-contained Client Component mapped to the `ActionComponent` interface.
- **Expected Props:** `variantId`, `price`, `stockQuantity`, `quantity`.
- **Button State & UX:**
  - Uses `lucide-react` icons (`Loader2` for loading, `ShoppingCart` for idle).
  - Maintains `isLoading` state, which locks the button and renders the spinner while awaiting the Server Action.
  - Acts as a secondary safety net: Renders as a disabled gray button reading "Out of Stock" if `stockQuantity === 0`.
- **Backend Flow:** Triggers `addToCartAction` Server Action. This action bypasses the Next.js REST API layer entirely and uses Payload's highly optimized Local API directly.
- **Success Handling:** Extracts the `openDrawer()` method from the global Zustand `useCart` store to smoothly open the side cart upon successful state mutation.

---

## 4. Design Patterns Utilized

### 4.1 Component Injection Pattern (Server-to-Client)
Solves the Next.js RSC function serialization error (`Error: Functions cannot be passed directly to Client Components`). 
Instead of trying to pass a dynamic `onClick` render function from the Server Page to the Client components, we pass the **Component Reference** itself. The Page imports `AddToCartButton` and passes it as `ActionComponent`. The Client Components dynamically render `<ActionComponent />` and feed it live `variantId` and `quantity` props.

### 4.2 State Lifting vs. Component Colocation
- **Lifted State:** `selectedVariantId` and `activeImageIndex` are lifted up to `ProductInteractive` to orchestrate cross-tree updates (Gallery changing when Variant changes).
- **Colocated State:** `quantities` remain strictly colocated inside `VariantSelector`. We do not want the image gallery to re-render just because a user clicked the "+" button on a variant.

---

## 5. Affected Files Registry
- **Cart Feature (The Injector):**
  - `src/features/cart/ui/AddToCartButton.tsx`
  - `src/features/cart/index.ts` (Exported Component)
- **Product Feature (The Receiver):**
  - `src/features/products/ui/_components/ProductInteractive.tsx` (Unified UI State)
  - `src/features/products/ui/VariantSelector.tsx` (Per-Variant Cards & Steppers)
  - `src/features/products/ui/ProductDetail.tsx` (Server Component Wrapper)
  - `src/features/products/types.ts` (`VariantSelectorProps` and `ActionComponent` Interfaces)
- **Application Routing (The Composer):**
  - `src/app/(storefront)/products/[slug]/page.tsx`
- **Documentation (Root):**
  - `src/features/products/README.md`
  - `src/features/cart/README.md`
  - `doc/add-to-cart-integration.md`
