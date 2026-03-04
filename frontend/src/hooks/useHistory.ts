import { useState, useCallback } from 'react'
import { HISTORY_KEY, MAX_HISTORY_ITEMS } from '../constants'
import type { HistoryItem } from '../types/url'

/**
 * Custom Hook: useHistory
 * Encapsule la lógica de persistencia del historial en localStorage.
 * Provee métodos memoizados para manipular y leer el historial.
 */
export const useHistory = () => {
    const [items, setItems] = useState<HistoryItem[]>(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY)
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    // Memoizado para evitar re-renders cuando el hook se consume en sub-componentes.
    const addToHistory = useCallback((newItem: HistoryItem) => {
        setItems((prev) => {
            const filtered = prev.filter((item) => item.original_url !== newItem.original_url)
            const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)

            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
            } catch (e) {
                console.warn('Error saving history to localStorage', e)
            }

            return updated
        })
    }, [])

    const clearHistory = useCallback(() => {
        setItems([])
        localStorage.removeItem(HISTORY_KEY)
    }, [])

    return { items, addToHistory, clearHistory }
}
