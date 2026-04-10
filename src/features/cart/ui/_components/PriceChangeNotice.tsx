/**
 * PriceChangeNotice Component
 *
 * Displays notification when prices have changed since items were added to cart.
 * Extracted from CartDrawer/CartPageContent for reusability (DRY).
 *
 * @see spec.md FR-014: Price change detection and display
 * @see data-model.md: price_at_add vs current variant price comparison
 */

import type { PriceChange } from '../../types'

/** Props for PriceChangeNotice */
interface PriceChangeNoticeProps {
    priceChanges: PriceChange[]
    /** Compact mode for drawer, full mode for cart page */
    compact?: boolean
}

/**
 * Price change alert banner.
 *
 * Shows when any item's current price differs from price_at_add.
 * Renders nothing if no changes detected.
 */
export function PriceChangeNotice({
    priceChanges,
    compact = false,
}: PriceChangeNoticeProps): React.ReactElement | null {
    if (priceChanges.length === 0) return null

    return (
        <div
            className={`rounded-lg border border-destructive/20 bg-destructive/10 ${compact ? 'p-3' : 'p-4'}`}
        >
            <p className={`font-medium text-destructive ${compact ? 'text-sm' : ''}`}>
                {compact
                    ? 'Some prices have changed since you added items:'
                    : 'Prices have changed since you added these items:'}
            </p>
            <ul className={`${compact ? 'mt-1 space-y-0.5' : 'mt-2 space-y-1'}`}>
                {priceChanges.map((change) => (
                    <li
                        key={change.variantId}
                        className={`text-destructive/80 ${compact ? 'text-xs' : 'text-sm'}`}
                    >
                        {change.variantName}: ${change.oldPrice.toFixed(2)} → ${change.newPrice.toFixed(2)}
                    </li>
                ))}
            </ul>
        </div>
    )
}
