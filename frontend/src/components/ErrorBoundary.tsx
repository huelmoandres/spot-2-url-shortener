import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
}

/**
 * Class-based React boundary that isolates fatal render errors.
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('CRITICAL UI ERROR:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-center">
                    <div className="glass p-8 rounded-3xl max-w-sm w-full border border-rose-500/30">
                        <h2 className="text-xl font-bold text-rose-400 mb-3">Algo salió mal</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Ocurrió un error inesperado al renderizar la interfaz.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
                        >
                            Recargar aplicación
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
