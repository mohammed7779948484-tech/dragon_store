'use client'

/**
 * GateForm — Password Gate Form Component
 *
 * Client component that renders the password entry form.
 * On success, redirects to the storefront home page.
 *
 * @see Constitution: Client components only when state/effects needed
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Checkbox } from '@/shared/ui/checkbox'
import { motion } from 'framer-motion'
import { scaleTap } from '@/shared/ui/motion/variants'

import { verifyPassword } from '../actions/verify-password.action'
import { GateError } from './_components/GateError'

export function GateForm(): React.ReactElement {
    const router = useRouter()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)

        const result = await verifyPassword({
            password: formData.get('password') as string,
            rememberMe: formData.get('rememberMe') === 'on',
        })

        if (result.success) {
            router.push('/')
            router.refresh()
        } else {
            setError(result.error || 'Authentication failed')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <GateError message={error} />}

            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                </Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        placeholder="Enter store password"
                        disabled={loading}
                        className="h-11 pl-4 pr-10 text-primary font-bold tracking-widest placeholder:text-muted-foreground/50 transition-all focus-visible:ring-primary"
                        aria-describedby={error ? 'gate-error' : undefined}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <svg className="h-5 w-5 hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Checkbox id="rememberMe" name="rememberMe" disabled={loading} className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border" />
                <Label htmlFor="rememberMe" className="text-sm font-medium text-muted-foreground cursor-pointer">
                    Remember me for 30 days
                </Label>
            </div>

            <motion.div variants={scaleTap} initial="rest" whileHover="hover" whileTap="tap">
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg
                                className="h-4 w-4 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Verifying...
                        </span>
                    ) : (
                        'Enter Store'
                    )}
                </Button>
            </motion.div>
        </form>
    )
}
