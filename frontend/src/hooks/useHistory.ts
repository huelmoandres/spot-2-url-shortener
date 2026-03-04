import { useState, useCallback } from 'react'
import { HISTORY_KEY, MAX_HISTORY_ITEMS } from '@/constants'
import type { HistoryItem } from '@/types/url'

/**
 * Persists URL history in localStorage and exposes memoized mutation helpers.
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

    // Memoized to reduce avoidable downstream re-renders.
    const addToHistory = useCallback((newItem: HistoryItem) => {
        setItems((prev) => {
            const filtered = prev.filter((item) => item.originalUrl !== newItem.originalUrl)
            const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)

            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
            } catch (e) {
                console.warn('Error saving history to localStorage', e)
            }

            return updated
        })
    }, [])

    const removeItem = useCallback((shortCode: string) => {
        setItems((prev) => {
            const updated = prev.filter((item) => item.shortCode !== shortCode)
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
            } catch (e) {
                console.warn('Error removing item from history', e)
            }
            return updated
        })
    }, [])

    const clearHistory = useCallback(() => {
        setItems([])
        localStorage.removeItem(HISTORY_KEY)
    }, [])

    return { items, addToHistory, clearHistory, removeItem }
}
