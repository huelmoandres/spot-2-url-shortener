import apiClient from '@/lib/api.client'
import type { PaginatedResponse, ShortenedUrl, UrlModel } from '@/types/url'

// Servicio de URLs — traduce operaciones de dominio a llamadas HTTP
export const urlService = {
    shorten: async (url: string): Promise<ShortenedUrl> => {
        const { data } = await apiClient.post<ShortenedUrl>('/shorten', { url })
        return data
    },

    getUrls: async (page = 1, perPage = 15, search = ''): Promise<PaginatedResponse<UrlModel>> => {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('per_page', perPage.toString())
        if (search) params.append('search', search)

        const { data } = await apiClient.get<PaginatedResponse<UrlModel>>(`/urls?${params.toString()}`)
        return data
    },

    deleteUrl: async (shortCode: string): Promise<void> => {
        await apiClient.delete(`/urls/${shortCode}`)
    },
}
