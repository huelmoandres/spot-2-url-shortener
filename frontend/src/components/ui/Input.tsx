import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * Activa el estado visual de error (borde rojo, ring rojo).
     * Se integra con react-hook-form: error={!!errors.url}
     */
    error?: boolean
}

/**
 * Input — Átomo base reutilizable.
 *
 * Extiende React.InputHTMLAttributes, por lo que acepta de forma transparente
 * todos los atributos nativos: disabled, required, aria-label, aria-describedby,
 * autoComplete, placeholder, type, ...register('field') de react-hook-form, etc.
 *
 * forwardRef expone el nodo <input> del DOM al padre para gestión de foco.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error = false, type = 'text', ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type}
                className={cn(
                    // Layout y tipografía
                    'block w-full rounded-xl px-5 py-4 text-sm font-medium',
                    // Colores base
                    'bg-slate-50 dark:bg-slate-950/50',
                    'text-slate-900 dark:text-slate-100',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-600',
                    // Transición suave
                    'transition-all duration-200',
                    // Focus ring accesible (cumple WCAG AA)
                    'focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4',
                    // Estado deshabilitado
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    // Estado condicional: normal vs error
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
