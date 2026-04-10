/**
 * GateError — Private Error Display Component
 *
 * Shows authentication and rate limit errors with appropriate styling.
 * This is a private component (in _components/) — NOT exported from index.ts.
 */

interface GateErrorProps {
    message: string
}

export function GateError({ message }: GateErrorProps): React.ReactElement {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
            <p className="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
                <span>{message}</span>
            </p>
        </div>
    )
}
