import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Card surface primitive and composable subcomponents.
 *
 * All subcomponents use `forwardRef` and standard div attributes for composition.
 */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'bg-white dark:bg-slate-900 rounded-3xl',
                'border border-slate-200 dark:border-slate-800',
                'shadow-xl shadow-slate-200/50 dark:shadow-none',
                'relative overflow-hidden',
                className
            )}
            {...props}
        />
    )
)
Card.displayName = 'Card'

/**
 * Optional top accent bar for brand emphasis.
 */
const CardAccent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'absolute top-0 left-0 w-full h-1',
                'bg-linear-to-r from-primary-500 to-indigo-600',
                className
            )}
            aria-hidden="true"
            {...props}
        />
    )
)
CardAccent.displayName = 'CardAccent'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'p-6 sm:p-8',
                'border-b border-slate-100 dark:border-slate-800',
                className
            )}
            {...props}
        />
    )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn(
                'text-2xl font-black text-slate-900 dark:text-white tracking-tight',
                className
            )}
            {...props}
        />
    )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn(
                'text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1',
                className
            )}
            {...props}
        />
    )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('p-6 sm:p-8', className)}
            {...props}
        />
    )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'p-6 sm:p-8',
                'border-t border-slate-100 dark:border-slate-800',
                'bg-slate-50/50 dark:bg-slate-950/20',
                className
            )}
            {...props}
        />
    )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardAccent, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
