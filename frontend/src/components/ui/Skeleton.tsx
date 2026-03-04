import type { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string
}

/**
 * Skeleton placeholder used to reduce perceived latency during async loads.
 */
export default function Skeleton({ className = '', ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-slate-800/50 rounded-md ${className}`}
            {...props}
            aria-hidden="true"
        />
    )
}
