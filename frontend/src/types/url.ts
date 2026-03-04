// Tipos que espeja exactamente los responses del backend Laravel

export interface ShortenedUrl {
    short_code: string
    short_url: string
    original_url: string
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
