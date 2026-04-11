/**
 * Breadcrumb Component
 *
 * Generic breadcrumb navigation for storefront pages.
 * Renders a trail of clickable links separated by chevrons.
 * Server Component — no client-side state needed.
 *
 * @see Constitution: shared/ui/ = dumb, primitive UI components
 */

import Link from 'next/link'

export interface BreadcrumbItem {
    label: string
    href?: string | undefined
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps): React.ReactElement {
    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1

                    return (
                        <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                            {/* Separator */}
                            {index > 0 && (
                                <svg
                                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            )}

                            {/* Breadcrumb item */}
                            {isLast || !item.href ? (
                                <span className="font-medium text-foreground">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="transition-colors hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
