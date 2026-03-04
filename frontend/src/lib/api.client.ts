import axios from 'axios'
import { API_BASE_URL } from '@/constants'

/**
 * API Client (Axios)
 * Configuración centralizada siguiendo mejores prácticas:
 * - BaseURL desde constantes (vía .env)
 * - Timeout para evitar peticiones colgadas (Performance)
 * - Headers estandarizados
 * - Interceptores para manejo de errores global
 */
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Crucial para Laravel: le indica que es una petición AJAX (evita redirecciones 302 en errores de sesión y requiere Sanctum si se activara auth)
        'X-Requested-With': 'XMLHttpRequest',
    }
})

// Interceptor de respuesta para logging en desarrollo
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
