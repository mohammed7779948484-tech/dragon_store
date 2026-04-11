/**
 * CodDisclaimer Component
 *
 * Private component displaying Cash on Delivery notice.
 * Informs the customer that payment is collected upon delivery.
 *
 * @see spec.md: FR-029 (CheckoutForm with COD disclaimer)
 * @see constitution: Tailwind CSS only, no inline styles
 * @see constitution: NO payment integrations — COD only
 */

export function CodDisclaimer(): React.ReactElement {
    return (
        <div className="rounded-[var(--radius-lg)] border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl" role="img" aria-label="Shop">
                    🏪
                </span>
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                        Pay on Pickup
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Payment will be collected at the store when you pick up your order.
                        Please have Cash or Card ready. No online payment is required right now.
                    </p>
                </div>
            </div>
        </div>
    )
}
