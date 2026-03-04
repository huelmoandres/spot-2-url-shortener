import { useState, useMemo, memo } from 'react'
import type { ShortenedUrl } from '@/types/url'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

interface Props {
    result: ShortenedUrl
    onNew: () => void
}

function UrlResultComponent({ result, onNew }: Props) {
    const [copied, setCopied] = useState(false)

    const shortCodeLength = useMemo(() => result.shortCode.length, [result.shortCode])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result.shortUrl)
        } catch {
            const el = document.createElement('textarea')
            el.value = result.shortUrl
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    return (
        <div className="animate-fade-in-up">
            {/* Cabecera de éxito */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-500/10 flex items-center justify-center border border-success-100 dark:border-success-500/20 shrink-0">
                    <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">¡Enlace listo!</h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                        Spot2 Shortener Service
                    </p>
                </div>
            </div>

            {/* Detalles del enlace */}
            <div className="space-y-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-950">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 block uppercase tracking-widest">
                        Enlace Acortado
                    </label>
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            target="_blank"
                            to={`/${result.shortCode}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-base transition-colors truncate underline decoration-primary-500/20 underline-offset-4"
                        >
                            {result.shortUrl}
                        </Link>
                        <span className="shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                            {shortCodeLength} CH
                        </span>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 block uppercase tracking-widest">
                        Propiedad Original
                    </label>
                    <p className="text-slate-700 dark:text-slate-300 text-xs font-medium break-all leading-relaxed line-clamp-2 italic">
                        {result.originalUrl}
                    </p>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
                <Button
                    id="copy-btn"
                    variant={copied ? 'success' : 'primary'}
                    size="lg"
                    onClick={handleCopy}
                    className="flex-1"
                >
                    {copied ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            ¡Copiado!
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copiar Enlace
                        </>
                    )}
                </Button>

                <Button
                    id="new-url-btn"
                    variant="outline"
                    size="lg"
                    onClick={onNew}
                    className="w-auto px-6"
                >
                    Nuevo
                </Button>
            </div>
        </div>
    )
}

export default memo(UrlResultComponent)
