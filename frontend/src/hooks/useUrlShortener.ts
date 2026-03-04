import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { urlService } from '../services/url.service'
import { useHistory } from './useHistory'
import type { ShortenedUrl, HistoryItem } from '../types/url'

/**
 * Custom Hook: useUrlShortener
 * Hook de dominio que orquestra la mutación asíncrona y la actualización del historial.
 */
export const useUrlShortener = () => {
    const { items: history, addToHistory } = useHistory()

    const mutation = useMutation({
        mutationFn: (url: string) => urlService.shorten(url),
        onSuccess: (data: ShortenedUrl) => {
            const newItem: HistoryItem = { ...data, createdAt: new Date().toISOString() }
            addToHistory(newItem)
            toast.success('URL acortada exitosamente')
        },
        onError: () => {
            toast.error('Ocurrió un error al procesar tu URL')
        }
    })

    return {
        shorten: mutation.mutate,
        result: mutation.data ?? null,
        isLoading: mutation.isPending,
        isError: mutation.isError,
        reset: mutation.reset,
        history,
    }
}
