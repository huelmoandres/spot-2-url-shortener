import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { urlService } from '@/services/url.service'
import { useHistory } from '@/hooks/useHistory'
import type { ShortenedUrl, HistoryItem } from '@/types/url'
import { URLS_QUERY_KEY } from '@/hooks/useUrls'

/**
 * Domain hook that orchestrates URL shortening mutation and history updates.
 */
export const useUrlShortener = () => {
    const { items: history, addToHistory } = useHistory()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (url: string) => urlService.shorten(url),
        onSuccess: (data: ShortenedUrl) => {
            const newItem: HistoryItem = { ...data, createdAt: new Date().toISOString() }
            addToHistory(newItem)
            toast.success('URL acortada exitosamente')
            queryClient.invalidateQueries({ queryKey: [URLS_QUERY_KEY] })
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
