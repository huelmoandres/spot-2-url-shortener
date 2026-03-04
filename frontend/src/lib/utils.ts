import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — Class Name utility
 *
 * Combina clsx (lógica condicional) con twMerge (resolución de conflictos Tailwind).
 * Garantiza que las clases pasadas desde el padre (override) tengan precedencia
 * sobre las clases por defecto del componente, sin duplicados ni conflictos.
 *
 * @example cn('px-4 py-2', isPrimary && 'bg-primary-600', className)
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
