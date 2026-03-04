import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { urlSchema, type UrlFormData } from '../schemas/url.schema'
import { useUrlShortener } from '../hooks/useUrlShortener'
import UrlResult from '../components/UrlResult'
import HistoryList from '../components/HistoryList'
import Skeleton from '../components/ui/Skeleton'

/**
 * HomePage
 * El componente principal ahora es un orquestador puramente visual.
 * Consume hooks de negocio (shortener) y componentes UI.
 */
export default function HomePage() {
    const { shorten, result, isLoading, history, reset } = useUrlShortener()

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors },
    } = useForm<UrlFormData>({ resolver: zodResolver(urlSchema) })

    const onSubmit = ({ url }: UrlFormData) => shorten(url)

    const handleNew = () => {
        reset()
        resetForm()
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-16 pb-12">
            {/* Header */}
            <header className="text-center mb-12 fade-in-up">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full glass text-xs font-medium text-indigo-300 tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Spot2 Tech Challenge
                </div>
                <h1 className="text-5xl font-extrabold mb-3 gradient-text tracking-tight">
                    URL Shortener
                </h1>
                <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
                    Convierte URLs largas en links cortos, elegantes y fáciles de compartir.
                </p>
            </header>

            <main className="w-full max-w-xl fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass rounded-3xl p-8 glow-indigo min-h-[300px] flex flex-col justify-center">
                    {isLoading ? (
                        /* Estado de carga Pro con Skeletons */
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full mt-4" />
                        </div>
                    ) : !result ? (
                        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isLoading}>
                            <label htmlFor="url-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                URL a acortar
                            </label>

                            <div className="relative">
                                <input
                                    id="url-input"
                                    type="url"
                                    disabled={isLoading}
                                    placeholder="https://example.com/url/muy/larga"
                                    autoComplete="off"
                                    className={[
                                        'w-full rounded-xl px-4 py-3.5 text-sm bg-white/50 dark:bg-white/5 border placeholder-slate-400 dark:placeholder-slate-500',
                                        'text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                        errors.url
                                            ? 'border-rose-500/60 focus:ring-rose-500/30'
                                            : 'border-slate-300 dark:border-white/10 focus:ring-indigo-500/40 focus:border-indigo-500/60',
                                    ].join(' ')}
                                    {...register('url')}
                                    aria-invalid={!!errors.url}
                                    aria-describedby={errors.url ? 'url-error' : undefined}
                                />
                            </div>

                            {/* Errores de validación */}
                            <div aria-live="polite">
                                {errors.url && (
                                    <p id="url-error" role="alert" className="mt-2 text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.url.message}
                                    </p>
                                )}
                            </div>

                            <button
                                id="shorten-btn"
                                type="submit"
                                disabled={isLoading}
                                aria-disabled={isLoading}
                                aria-label={isLoading ? 'Acortando la URL, por favor espere' : 'Acortar URL'}
                                className={[
                                    'mt-6 w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200 shadow-md',
                                    'bg-gradient-to-r from-indigo-500 to-violet-500 mx-auto block',
                                    'hover:from-indigo-600 hover:to-violet-600 active:scale-[0.98]',
                                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                                    'disabled:opacity-60 disabled:cursor-wait'
                                ].join(' ')}
                            >
                                {isLoading ? 'Acortando...' : 'Acortar URL'}
                            </button>
                        </form>
                    ) : (
                        <UrlResult result={result} onNew={handleNew} />
                    )}
                </div>

                {history.length > 0 && (
                    <div className="mt-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <HistoryList items={history} />
                    </div>
                )}
            </main>

            <footer className="mt-auto pt-12 text-center text-slate-600 text-xs">
                Spot2 Tech Challenge · Andrés Huelmo
            </footer>
        </div>
    )
}
