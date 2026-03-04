import apiClient from '../lib/api.client'
import type { ShortenedUrl } from '../types/url'

// Servicio de URLs — traduce operaciones de dominio a llamadas HTTP
export const urlService = {
    shorten: async (url: string): Promise<ShortenedUrl> => {
        const { data } = await apiClient.post<ShortenedUrl>('/shorten', { url })
        return data
    },
}
