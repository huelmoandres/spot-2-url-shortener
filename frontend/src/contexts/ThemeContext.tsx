import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { THEME_KEY } from '../constants'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem(THEME_KEY) as Theme | null
        return saved ?? 'dark'
    })

    // Aplica la clase al <html> para que Tailwind pueda usarla con `dark:`
    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle('dark', theme === 'dark')
        root.classList.toggle('light', theme === 'light')
        localStorage.setItem(THEME_KEY, theme)
    }, [theme])

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

// Hook tipado con invariant para detectar errores de uso fuera del provider
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
    return ctx
}
