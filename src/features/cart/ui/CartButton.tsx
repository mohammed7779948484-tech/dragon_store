/**
 * CartButton Component
 *
 * Header button with item count badge. Opens the cart drawer.
 * Badge count is passed from server (NOT from Zustand).
 *
 * @see spec.md FR-012: CartButton showing item count badge
 * @see Constitution: Tailwind CSS only, semantic HTML, a11y
 */

'use client'

import { Badge } from '@/shared/ui/badge'
import { useCart } from '../logic/cart.store'

/** Props for CartButton */
interface CartButtonProps {
    /** Number of items currently in cart (from server) */
    itemCount: number
}

/**
 * Cart icon button for the header.
 *
 * Shows shopping cart icon with badge showing item count.
 * Opens CartDrawer via Zustand `openDrawer`.
 */
export function CartButton({ itemCount }: CartButtonProps): React.ReactElement {
    const { openDrawer } = useCart()

    return (
        <button
            type="button"
            onClick={openDrawer}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent dark:hover:bg-accent"
            aria-label={`Open cart (${itemCount} items)`}
        >
            {/* Shopping cart icon */}
            <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
            </svg>

            {/* Item count badge */}
            {itemCount > 0 && (
                <Badge
                    variant="destructive"
                    className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                >
                    {itemCount > 99 ? '99+' : itemCount}
                </Badge>
            )}
        </button>
    )
}
