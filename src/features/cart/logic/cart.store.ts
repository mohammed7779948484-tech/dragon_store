/**
 * Cart UI Store (Zustand)
 *
 * UI-only state for cart drawer. NO cart items stored here —
 * server is the single source of truth for cart data.
 *
 * @see Constitution Lines 1163-1187: CRITICAL: UI-Only, No Item Data
 * @see Constitution Line 77: cart.store.ts naming pattern
 * @see spec.md: FR-013 (Zustand for UI state only)
 */

'use client'

import { create } from 'zustand'

/**
 * Cart UI state — EXACTLY per constitution.
 * NO items[], NO total, NO persist, NO localStorage.
 */
interface CartUIState {
    isDrawerOpen: boolean
    isLoading: boolean
    openDrawer: () => void
    closeDrawer: () => void
    setLoading: (loading: boolean) => void
}

/**
 * Cart UI store.
 *
 * Contains ONLY UI state:
 * - isDrawerOpen: whether the cart drawer/sheet is open
 * - isLoading: whether a cart operation is in progress
 *
 * Cart items, totals, and counts are fetched from the server
 * on every render — NOT stored in Zustand.
 */
export const useCart = create<CartUIState>((set) => ({
    isDrawerOpen: false,
    isLoading: false,

    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false }),
    setLoading: (loading) => set({ isLoading: loading }),
}))
