/**
 * CartItem Component
 *
 * Displays a single cart item with product info, quantity, and price.
 * Server-fetched data passed as props (NOT from Zustand).
 *
 * @see Constitution Lines 1163-1187: Cart data from server, not Zustand
 * @see spec.md FR-016: Loading spinner on affected item
 */

'use client'

import { useTransition } from 'react'
import { CloudinaryImage } from '@/shared/ui/CloudinaryImage'
import { Trash2, Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { updateQuantityAction } from '../../actions/update-quantity.action'
import { removeItemAction } from '../../actions/remove-item.action'
import { useCart } from '../../logic/cart.store'
import { MAX_QUANTITY } from '../../constants'
import type { CartItemData } from '../../types'

/** Props for CartItem component */
interface CartItemProps {
    item: CartItemData
    isLoading?: boolean
}

/**
 * Individual cart item row.
 *
 * Shows product image, name, variant, quantity, and price.
 * Greyed out when item is inactive (FR-015).
 * Loading overlay when server operation is in progress (FR-016).
 */
export function CartItem({ item, isLoading = false }: CartItemProps): React.ReactElement {
    const hasChanged = item.priceAtAdd !== item.currentPrice && item.isActive

    // Server-driven state: no optimistic UI hacks to ensure subtotal remains perfectly in sync
    const [isPending, startTransition] = useTransition()
    const { setLoading } = useCart()

    const handleUpdateQuantity = (newQuantity: number) => {
        if (newQuantity < 1) return

        startTransition(async () => {
            // NO full screen loader for quantity updates, just local spinner
            // User knows the server is processing their request
            await updateQuantityAction({
                cartItemId: item.id,
                quantity: newQuantity,
            })
        })
    }

    const handleRemove = () => {
        startTransition(async () => {
            setLoading(true) // Full screen loader is okay for removal
            await removeItemAction({
                cartItemId: item.id,
            })
            setLoading(false)
        })
    }

    // Only show spinner for external global loads or destructive actions
    const isWorking = isLoading || isPending

    return (
        <div
            className={cn(
                'relative flex gap-3 rounded-lg border border-border bg-card p-3 transition-opacity',
                !item.isActive && 'opacity-50',
                isLoading && 'pointer-events-none opacity-60'
            )}
        >
            {/* Loading overlay */}
            {isWorking && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
                </div>
            )}

            {/* Product image */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {item.imageUrl || item.cloudinaryPublicId ? (
                    <CloudinaryImage
                        src={item.imageUrl}
                        publicId={item.cloudinaryPublicId}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Product info */}
            <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                    <p className="truncate text-sm font-medium text-foreground">
                        {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {item.variantName}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center rounded-md border border-border">
                        <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.quantity - 1)}
                            disabled={item.quantity <= 1 || isWorking}
                            className="flex h-7 w-7 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-7 w-8 items-center justify-center text-xs font-medium text-foreground border-x border-border">
                            {item.quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.quantity + 1)}
                            disabled={item.quantity >= item.stockQuantity || item.quantity >= MAX_QUANTITY || isWorking}
                            className="flex h-7 w-7 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                        {!item.isActive ? (
                            <span className="text-xs font-medium text-destructive">Unavailable</span>
                        ) : hasChanged ? (
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-muted-foreground line-through">
                                    ${item.priceAtAdd.toFixed(2)}
                                </span>
                                <span className="text-sm font-semibold text-primary">
                                    ${item.currentPrice.toFixed(2)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm font-semibold text-foreground">
                                ${(item.currentPrice * item.quantity).toFixed(2)}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={isWorking}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            aria-label="Remove item"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
