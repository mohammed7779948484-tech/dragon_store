/**
 * Status Timeline Component
 *
 * Visual timeline showing order status progression:
 * pending → processing → completed (or cancelled)
 *
 * @see spec.md: FR-032 (StatusTimeline component)
 * @see Constitution: Tailwind only, no inline styles
 */

import { cn } from '@/shared/lib/utils'
import type { TimelineStep } from '../../types'

interface StatusTimelineProps {
    steps: TimelineStep[]
}

/** Status-specific color classes */
const STATUS_COLORS = {
    active: 'border-primary bg-primary text-primary-foreground',
    completed: 'border-success bg-success text-success-foreground',
    cancelled: 'border-destructive bg-destructive text-destructive-foreground',
    pending: 'border-muted-foreground/30 bg-muted text-muted-foreground',
} as const

function getStepStyle(step: TimelineStep, isCancelled: boolean): string {
    if (isCancelled && step.status === 'cancelled') return STATUS_COLORS.cancelled
    if (step.isCompleted) return STATUS_COLORS.completed
    if (step.isActive) return STATUS_COLORS.active
    return STATUS_COLORS.pending
}

function getConnectorStyle(isCompleted: boolean): string {
    return isCompleted ? 'bg-success' : 'bg-muted-foreground/20'
}

export function StatusTimeline({ steps }: StatusTimelineProps): React.ReactElement {
    const isCancelled = steps.some((s) => s.status === 'cancelled')

    return (
        <div className="space-y-0">
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1
                const stepStyle = getStepStyle(step, isCancelled)

                return (
                    <div key={step.status} className="flex gap-4">
                        {/* Timeline indicator column */}
                        <div className="flex flex-col items-center">
                            {/* Circle */}
                            <div
                                className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                                    stepStyle
                                )}
                            >
                                {step.isCompleted ? '✓' : index + 1}
                            </div>
                            {/* Connector line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        'h-12 w-0.5 transition-colors',
                                        getConnectorStyle(step.isCompleted)
                                    )}
                                />
                            )}
                        </div>

                        {/* Content column */}
                        <div className="pb-8 pt-1">
                            <p
                                className={cn(
                                    'text-sm font-semibold',
                                    step.isActive || step.isCompleted
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'
                                )}
                            >
                                {step.label}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {step.description}
                            </p>
                            {step.timestamp && (
                                <p className="mt-1 text-xs text-muted-foreground/70">
                                    {new Date(step.timestamp).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
