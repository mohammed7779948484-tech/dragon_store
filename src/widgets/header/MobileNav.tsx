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
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C7.58 2 4 5.58 4 10v8a4 4 0 004 4h8a4 4 0 004-4v-8c0-4.42-3.58-8-8-8zm0 2c3.31 0 6 2.69 6 6v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8c0-3.31 2.69-6 6-6z" />
                            </svg>
                        </div>
                        Puff puff pass
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
