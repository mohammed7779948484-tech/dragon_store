'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/shared/ui/sheet'
import { Menu } from 'lucide-react'

export function MobileNav(): React.ReactElement {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border md:hidden text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-full flex-col sm:max-w-md bg-background/95 backdrop-blur-xl border-r border-border/50">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-left text-xl font-bold flex items-center gap-2">
                        <div className="flex items-center justify-center">
                            <img src="/logo.png" alt="Dragon Logo" className="h-10 w-auto object-contain drop-shadow-sm" />
                        </div>
                        Dragon
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-4">
                    <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                        Home
                    </Link>
                    <Link
                        href="/products"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                        Products
                    </Link>
                    <Link
                        href="/brands"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                        Brands
                    </Link>
                    <Link
                        href="/categories"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                        Categories
                    </Link>
                    <Link
                        href="/track-order"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-bold text-primary hover:text-primary/80 transition-colors py-2 border-b border-border/50"
                    >
                        Track Order
                    </Link>
                </nav>
            </SheetContent>
        </Sheet>
    )
}
