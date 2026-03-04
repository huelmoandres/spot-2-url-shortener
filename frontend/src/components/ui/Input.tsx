import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * Enables error visuals (red border and focus ring).
     */
    error?: boolean
}

/**
 * Reusable input primitive with full native input attribute support.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error = false, type = 'text', ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type}
                className={cn(
                    // Layout and typography.
                    'block w-full rounded-xl px-5 py-4 text-sm font-medium',
                    // Base colors.
                    'bg-slate-50 dark:bg-slate-950/50',
                    'text-slate-900 dark:text-slate-100',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-600',
                    // Smooth transitions.
                    'transition-all duration-200',
                    // Accessible focus ring.
                    'focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4',
                    // Disabled state.
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    // Conditional normal/error state.
                    error
                        ? [
                            'border border-danger-300 dark:border-danger-900/50',
                            'focus:ring-danger-500/10 focus:border-danger-500',
                          ]
                        : [
                            'border border-slate-200 dark:border-slate-800',
                            'focus:ring-primary-500/10 focus:border-primary-500',
                          ],
                    className
                )}
                aria-invalid={error || undefined}
                {...props}
            />
        )
    }
)

Input.displayName = 'Input'

export { Input }
