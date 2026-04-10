/**
 * CustomerFields Component
 *
 * Private component for checkout form customer information fields.
 * Renders name, phone, address, and optional notes inputs.
 *
 * @see spec.md: FR-026 (customerName, customerPhone, deliveryAddress, notes)
 * @see constitution: Tailwind CSS only, no inline styles
 * @see constitution: Private components in ui/_components/
 */

'use client'

import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

interface CustomerFieldsProps {
    errors?: Record<string, string>
    disabled?: boolean
}

export function CustomerFields({ errors, disabled }: CustomerFieldsProps): React.ReactElement {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
                Customer Information
            </h2>

            {/* Customer Name */}
            <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                    id="customerName"
                    name="customerName"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    minLength={2}
                    maxLength={255}
                    disabled={disabled}
                    aria-describedby={errors?.customerName ? 'customerName-error' : undefined}
                    className={errors?.customerName ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors?.customerName && (
                    <p id="customerName-error" className="text-sm text-destructive">
                        {errors.customerName}
                    </p>
                )}
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    placeholder="+15551234567"
                    required
                    disabled={disabled}
                    aria-describedby={errors?.customerPhone ? 'customerPhone-error' : undefined}
                    className={errors?.customerPhone ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                    US format: +1 followed by 10 digits
                </p>
                {errors?.customerPhone && (
                    <p id="customerPhone-error" className="text-sm text-destructive">
                        {errors.customerPhone}
                    </p>
                )}
            </div>



            {/* Order Notes (Optional) */}
            <div className="space-y-2">
                <Label htmlFor="notes">
                    Order Notes <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <textarea
                    id="notes"
                    name="notes"
                    placeholder="Special instructions or requests..."
                    maxLength={1000}
                    rows={2}
                    disabled={disabled}
                    className="flex w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            {/* Honeypot Field — Hidden from humans, filled by bots */}
            <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                <Label htmlFor="honeypotField">Leave this empty</Label>
                <Input
                    id="honeypotField"
                    name="honeypotField"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>
        </div>
    )
}
