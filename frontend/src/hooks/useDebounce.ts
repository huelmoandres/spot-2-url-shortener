import { useState, useEffect } from 'react'

/**
 * Retrasa la actualización de un valor por un tiempo definido.
 * Utilizado para evitar llamadas múltiples a la API mientras el usuario escribe en un input de búsqueda.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}
