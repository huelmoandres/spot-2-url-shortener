// Tipos que espeja exactamente los responses del backend Laravel

export interface ShortenedUrl {
    shortCode: string
    shortUrl: string
    originalUrl: string
}

export interface ValidationError {
    message: string
    errors: {
        url?: string[]
        [key: string]: string[] | undefined
    }
}

export interface HistoryItem extends ShortenedUrl {
    createdAt: string
}

export interface PaginatedResponse<T> {
    data: T[]
    links: {
        first: string | null
        last: string | null
        prev: string | null
        next: string | null
    }
    meta: {
        current_page: number
        from: number | null
        last_page: number
        links: { url: string | null; label: string; active: boolean }[]
        path: string
        per_page: number
        to: number | null
        total: number
    }
}

// Since the new backend API returns full models, define a more complete URL interface
export interface UrlModel {
    id: number
    originalUrl: string
    shortCode: string
    shortUrl: string
    clickCount: number
    createdAt: string
    updatedAt: string
}
