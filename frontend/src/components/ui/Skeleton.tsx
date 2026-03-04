import type { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string
}

/**
 * Componente Skeleton
 * Provee un efecto de carga asíncrona ("shimmer") para mejorar la UX percibida.
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
