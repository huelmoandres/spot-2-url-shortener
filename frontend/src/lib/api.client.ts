import axios from 'axios'
import { API_BASE_URL } from '@/constants'

/**
 * Shared Axios client with sane defaults and centralized error interception.
 */
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Ensures Laravel treats the request as AJAX and returns JSON-shaped errors.
        'X-Requested-With': 'XMLHttpRequest',
    }
})

// Development-only response logging for faster troubleshooting.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (import.meta.env.DEV) {
            console.error('[API Error Source]', error.config?.url, error.response?.status)
        }
        return Promise.reject(error)
    },
)

export default apiClient
