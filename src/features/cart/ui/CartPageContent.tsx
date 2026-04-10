/**
 * CartPageContent Component
 *
 * Server-rendered full cart page content with items, price change notice, and summary.
 * This is a PUBLIC component exported via barrel — unlike _components/ which are private.
 *
 * @see Constitution Line 216-234: Private components stay in _components/
 * @see Constitution: Server Components by default
 */

import { CartItem } from './_components/CartItem'
import { CartSummary } from './_components/CartSummary'
import { EmptyCart } from './_components/EmptyCart'
import { PriceChangeNotice } from './_components/PriceChangeNotice'
import type { CartItemData, PriceChange } from '../types'

/** Props for CartPageContent */
interface CartPageContentProps {
    items: CartItemData[]
    priceChanges: PriceChange[]
}

/**
 * Full cart view for the /cart page.
 *
 * Composes private sub-components: CartItem, CartSummary, EmptyCart.
 * Only THIS component is exported from the feature — sub-components are private.
 */
export function CartPageContent({ items, priceChanges }: CartPageContentProps): React.ReactElement {
    const subtotal = items
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + item.currentPrice * item.quantity, 0)

    const hasInactiveItems = items.some((item) => !item.isActive)

    if (items.length === 0) {
        return <EmptyCart />
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart items */}
            <div className="space-y-3 lg:col-span-2">
                {/* Price change notice */}
                <PriceChangeNotice priceChanges={priceChanges} />

                {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                ))}
            </div>

            {/* Summary sidebar */}
            <div className="rounded-lg border border-border p-4">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                    Order Summary
                </h2>
                <CartSummary
                    itemCount={items.length}
                    subtotal={subtotal}
                    hasInactiveItems={hasInactiveItems}
                />
            </div>
        </div>
    )
}
