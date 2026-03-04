import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PaginatedResponse, UrlModel } from '@/types/url'
import { urlService } from '@/services/url.service'
import toast from 'react-hot-toast'
import { useHistory } from '@/hooks/useHistory'

export const URLS_QUERY_KEY = 'urls'

export function useUrls(page: number, perPage: number, search: string) {
    const queryClient = useQueryClient()
    const { removeItem } = useHistory()

    // Query for fetching the paginated list of URLs
    const query = useQuery<PaginatedResponse<UrlModel>>({
        queryKey: [URLS_QUERY_KEY, page, perPage, search],
        queryFn: () => urlService.getUrls(page, perPage, search),
    })

    // Mutation for deleting a URL
    const deleteMutation = useMutation({
        mutationFn: (shortCode: string) => urlService.deleteUrl(shortCode),
        onSuccess: (_, shortCode) => {
            toast.success('URL eliminada correctamente')
            queryClient.invalidateQueries({ queryKey: [URLS_QUERY_KEY] })
            removeItem(shortCode)
        },
        onError: () => {
            toast.error('Ocurrió un error al eliminar la URL')
        },
    })

    return {
        ...query,
        paginatedData: query.data,
        deleteUrl: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    }
}
