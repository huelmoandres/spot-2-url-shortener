import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { urlSchema, type UrlFormData } from '@/schemas/url.schema'
import { useUrlShortener } from '@/hooks/useUrlShortener'
import UrlResult from '@/components/UrlResult'
import HistoryList from '@/components/HistoryList'
import Skeleton from '@/components/ui/Skeleton'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardAccent, CardContent } from '@/components/ui/Card'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
        <div className="min-h-screen font-inter px-4 py-8 sm:py-10 lg:py-12">
            <main className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                {/* Columna izquierda: contexto + historial */}
                <section className="space-y-6 animate-fade-in-up">
                    <Card className="p-6 sm:p-8">
                        <CardAccent />
                        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-[10px] font-bold text-primary-800 dark:text-primary-400 tracking-wider uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                            Spot2 Prop-Tech Solutions
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-black mb-3 text-slate-900 dark:text-white tracking-tight leading-tight">
                            Short<span className="text-primary-500">Links</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                            Un flujo limpio para equipos comerciales: crea enlaces cortos, compártelos al instante y consulta actividad reciente sin salir de esta pantalla.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link
                                to="/urls"
                                className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'gap-2')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Ver librería completa
                            </Link>
                        </div>
                    </Card>

                    <Card className="p-5 sm:p-6">
                        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                            Actividad reciente
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            Tus últimos enlaces acortados aparecen aquí para acceso rápido.
                        </p>

                        {history.length > 0 ? (
                            <HistoryList items={history} />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center bg-slate-50/60 dark:bg-slate-950/40">
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    Aún no tienes actividad reciente.
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    Crea tu primer enlace en la columna derecha.
                                </p>
                            </div>
                        )}
                    </Card>
                </section>

                {/* Columna derecha: alta de URL + resultado */}
                <section className="animate-fade-in-up [animation-delay:150ms]">
                    <Card className="min-h-[420px] flex flex-col justify-center">
                        <CardAccent />
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24 rounded-md" />
                                        <Skeleton className="h-14 w-full rounded-xl" />
                                    </div>
                                    <Skeleton className="h-14 w-full rounded-xl mt-6" />
                                </div>
                            ) : !result ? (
                                <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isLoading}>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                                        Alta de enlace
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                        Ingresa la URL de destino para generar su versión corta.
                                    </p>

                                    <div className="mb-6">
                                        <label
                                            htmlFor="url-input"
                                            className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
                                        >
                                            URL original
                                        </label>

                                        <Input
                                            id="url-input"
                                            type="url"
                                            error={!!errors.url}
                                            disabled={isLoading}
                                            placeholder="https://spot2.mx/propiedad/ejemplo-exclusivo"
                                            autoComplete="off"
                                            aria-describedby={errors.url ? 'url-error' : undefined}
                                            {...register('url')}
                                        />

                                        <div aria-live="polite" className="h-6">
                                            {errors.url && (
                                                <p
                                                    id="url-error"
                                                    role="alert"
                                                    className="mt-2 text-xs font-bold text-danger-600 dark:text-danger-400 flex items-center gap-1.5"
                                                >
                                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {errors.url.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        id="shorten-btn"
                                        type="submit"
                                        size="lg"
                                        isLoading={isLoading}
                                    >
                                        Generar enlace corto
                                    </Button>
                                </form>
                            ) : (
                                <UrlResult result={result} onNew={handleNew} />
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>

            <footer className="mx-auto w-full max-w-7xl pt-10 text-center text-slate-500 dark:text-slate-600 text-xs font-semibold tracking-wide">
                &copy; {new Date().getFullYear()} SPOT2 PRO &middot; TECH CHALLENGE &middot; ANDRÉS HUELMO
            </footer>
        </div>
    )
}
