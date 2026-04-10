'use client'

import { useState } from 'react'
import { addToCartAction } from '../actions/add-to-cart.action'
import { useCart } from '../logic/cart.store'
import { Button } from '@/shared/ui/button'
import { Loader2, ShoppingCart } from 'lucide-react'

export interface AddToCartButtonProps {
    variantId: number
    price: number
    stockQuantity: number
    quantity: number
}

export function AddToCartButton({
    variantId,
    stockQuantity,
    quantity,
}: AddToCartButtonProps): React.ReactElement {
    const [isLoading, setIsLoading] = useState(false)
    const { openDrawer } = useCart()

    async function handleAddToCart() {
        setIsLoading(true)

        const result = await addToCartAction({
            variantId,
            quantity,
        })

        setIsLoading(false)

        if (result.success) {
            openDrawer()
        }
    }

    if (stockQuantity === 0) {
        return (
            <Button disabled className="w-full bg-muted text-muted-foreground">
                Out of Stock
            </Button>
        )
    }

    return (
        <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full shadow-md transition-all bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding...
                </>
            ) : (
                <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                </>
            )}
        </Button>
    )
}
