/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * `buttonVariants` centralizes button visual variants via CVA.
 */
export const buttonVariants = cva(
    // Shared base classes for every variant.
    [
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold',
        'transition-all duration-200 select-none cursor-pointer',
        'focus:outline-none focus:ring-4',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
    ],
    {
        variants: {
            /** Visual style variants aligned with the design system palette. */
            variant: {
                /** Primary application CTA. */
                default: [
                    'bg-slate-900 dark:bg-primary-600 text-white shadow-lg',
                    'hover:bg-black dark:hover:bg-primary-500',
                    'focus:ring-primary-500/20',
                ],
                /** Brand-emphasis action. */
                primary: [
                    'bg-primary-600 text-white shadow-lg shadow-primary-500/20',
                    'hover:bg-primary-500',
                    'focus:ring-primary-500/20',
                ],
                /** Bordered secondary action. */
                outline: [
                    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
                    'text-slate-700 dark:text-slate-200 shadow-sm',
                    'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md',
                    'focus:ring-slate-500/10',
                ],
                /** Positive action (copy/confirm). */
                success: [
                    'bg-success-500 text-white shadow-lg shadow-success-500/20',
                    'hover:bg-success-600',
                    'focus:ring-success-500/20',
                ],
                /** Destructive action (delete/remove). */
                destructive: [
                    'bg-danger-600 text-white shadow-lg shadow-danger-600/20',
                    'hover:bg-danger-700',
                    'focus:ring-danger-500/20',
                ],
                /** Text-first action without background. */
                ghost: [
                    'text-slate-700 dark:text-slate-200',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    'focus:ring-slate-500/10',
                ],
                /** Link-like action. */
                link: [
                    'text-primary-600 dark:text-primary-400 underline-offset-4',
                    'hover:underline hover:text-primary-700 dark:hover:text-primary-300',
                    'focus:ring-primary-500/20',
                ],
            },
            /** Size variants. */
            size: {
                sm:   'px-4 py-2 text-xs',
                md:   'px-5 py-3 text-sm',
                lg:   'px-6 py-4 text-sm w-full',
                icon: 'p-2.5',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    /** Shows a spinner and disables the button while pending. */
    isLoading?: boolean
}

/**
 * Reusable button primitive with `forwardRef` for focus management integrations.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading = false, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(buttonVariants({ variant, size }), className)}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="animate-spin h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'

export { Button }
