import { TrackOrderForm } from '@/features/order-tracking/ui/TrackOrderForm'

/**
 * Track Order Section Widget
 * 
 * A luxurious, glassmorphic section designed for the Home Page
 * to allow users to quickly look up their order status.
 */
export function TrackOrderSection(): React.ReactElement {
    return (
        <section className="mb-20">
            <div className="mb-8 flex flex-col items-center justify-center text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Track Your Order
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg">
                    Stay updated on your luxury order. Enter your order or phone number below.
                </p>
            </div>

            <div className="mx-auto max-w-2xl rounded-[var(--radius-xl)] bg-card/30 backdrop-blur-2xl border border-border/50 p-6 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
                {/* Ambient Subtle Glow */}
                <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-foreground/5 blur-[80px] pointer-events-none" />

                <div className="relative z-10">
                    <TrackOrderForm />
                </div>
            </div>
        </section>
    )
}
