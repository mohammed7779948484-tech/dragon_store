/**
 * Header Widget
 *
 * Main navigation header for the storefront.
 * Composes features: store name, navigation, CartButton with drawer.
 */
import { verifySession } from '@/core/auth/session'
import { getCartBySession, getCartItems, getCartItemCount, detectPriceChanges } from '@/features/cart'
import { HeaderUI } from './HeaderUI'

/**
 * Server-side header widget.
 *
 * Fetches cart data on the server and passes as props to client components.
 */
export async function Header(): Promise<React.ReactElement> {
    // Fetch cart data server-side
    let cartItemCount = 0
    let cartItems: Awaited<ReturnType<typeof getCartItems>> = []
    let priceChanges: ReturnType<typeof detectPriceChanges> = []

    const session = await verifySession()
    if (session) {
        const cart = await getCartBySession(session.sessionId)
        if (cart) {
            cartItemCount = await getCartItemCount(cart.id)
            cartItems = await getCartItems(cart.id)
            priceChanges = detectPriceChanges(cartItems)
        }
    }

    return (
        <HeaderUI
            cartItemCount={cartItemCount}
            cartItems={cartItems}
            priceChanges={priceChanges}
        />
    )
}
