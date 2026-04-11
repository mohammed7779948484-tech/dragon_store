/**
 * CartDrawer Component
 *
 * Side drawer showing cart contents. Uses shadcn/ui Sheet.
 * Cart data is fetched from server and passed as props.
 * Zustand controls only drawer visibility and loading state.
 *
 * Infused with Framer Motion for staggered item entrance.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/shared/ui/sheet'
import { fadeUp, staggerContainer } from '@/shared/ui/motion/variants'
import { useCart } from '../logic/cart.store'
import { CartItem } from './_components/CartItem'
import { CartSummary } from './_components/CartSummary'
import { EmptyCart } from './_components/EmptyCart'
import { PriceChangeNotice } from './_components/PriceChangeNotice'
import type { CartItemData, PriceChange } from '../types'

/** Props for CartDrawer — all data from server */
interface CartDrawerProps {
    items: CartItemData[]
    priceChanges: PriceChange[]
}

/**
 * Slide-out cart drawer.
 *
 * - Items and totals are passed from Server Component (NOT from Zustand)
 * - Drawer open/close state is managed by Zustand (useCart)
 * - Loading overlay shown during server actions
 */
export function CartDrawer({ items, priceChanges }: CartDrawerProps): React.ReactElement {
    const { isDrawerOpen, closeDrawer, isLoading } = useCart()

    const subtotal = items
        .filter((item) => item.isActive)
        .reduce((sum, item) => sum + item.currentPrice * item.quantity, 0)

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    const hasInactiveItems = items.some((item) => !item.isActive)

    return (
        <Sheet open={isDrawerOpen} onOpenChange={closeDrawer}>
            <SheetContent className="flex w-full flex-col sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="text-left">
                        Shopping Cart ({totalQuantity})
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <EmptyCart />
                ) : (
                    <>
                        {/* Price change notice */}
                        <PriceChangeNotice priceChanges={priceChanges} compact />

                        {/* Cart items list with staggered animations */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            className="flex-1 space-y-2 overflow-y-auto py-2"
                        >
                            <AnimatePresence mode="popLayout">
                                {items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        variants={fadeUp}
                                        layout
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    >
                                        <CartItem
                                            item={item}
                                            isLoading={isLoading}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {/* Summary + checkout */}
                        <CartSummary
                            itemCount={totalQuantity}
                            subtotal={subtotal}
                            hasInactiveItems={hasInactiveItems}
                        />
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
