/**
 * Categories Listing Page
 *
 * Displays all active root categories in a grid.
 */

import { getActiveCategories } from '@/features/products'
import { CategoryGrid } from '@/features/products'

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'All Categories — Puff puff pass',
    description: 'Browse our product categories',
}

export const revalidate = 60

export default async function CategoriesPage(): Promise<React.ReactElement> {
    const categories = await getActiveCategories()

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    All Categories
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {categories.length} categories available
                </p>
            </div>

            {categories.length > 0 ? (
                <CategoryGrid categories={categories} />
            ) : (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        No categories yet. Check back soon!
                    </p>
                </div>
            )}
        </div>
    )
}
