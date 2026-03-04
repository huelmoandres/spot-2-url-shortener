import { useState, useMemo, memo } from 'react'
import type { ShortenedUrl } from '../types/url'

interface Props {
    result: ShortenedUrl
    onNew: () => void
}

/**
 * Componente UrlResult
 * Muestra el resultado de la operación satisfactoria.
 * Optimizado con React.memo y useMemo para evitar re-renders innecesarios.
 */
function UrlResultComponent({ result, onNew }: Props) {
    const [copied, setCopied] = useState(false)

    // Memorizamos cálculos que dependan de propiedades dinámicas
    const shortCodeLength = useMemo(() => result.short_code.length, [result.short_code])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result.short_url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch {
            const el = document.createElement('textarea')
            el.value = result.short_url
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        }
    }

    return (
        <div className="fade-in-up">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
                <span className="text-emerald-400 text-sm font-medium">¡URL acortada exitosamente!</span>
            </div>

            <div className="bg-white/50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 mb-3 shadow-sm">
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-medium">URL corta</p>
                <div className="flex items-center justify-between gap-3">
                    <a
                        href={result.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-mono text-sm font-semibold transition-colors truncate"
                    >
                        {result.short_url}
                    </a>
                    <span className="shrink-0 text-xs text-slate-600 dark:text-slate-500 bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        {shortCodeLength} chars
                    </span>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 mb-5 shadow-sm">
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-medium">URL original</p>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-mono break-all leading-relaxed line-clamp-2">
                    {result.original_url}
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    id="copy-btn"
                    onClick={handleCopy}
                    className={[
                        'flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent',
                        copied
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 focus:ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500/50 shadow-md',
                    ].join(' ')}
                >
                    <span className="flex items-center justify-center gap-2">
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                ¡Copiado!
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copiar
                            </>
                        )}
                    </span>
                </button>

                <button
                    id="new-url-btn"
                    onClick={onNew}
                    className="py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white/10 shadow-sm"
                >
                    Nueva
                </button>
            </div>
        </div>
    )
}

export default memo(UrlResultComponent)
