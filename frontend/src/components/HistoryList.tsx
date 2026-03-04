import { memo } from 'react'
import type { HistoryItem } from '../types/url'

interface Props {
    items: HistoryItem[]
}

const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Componente HistoryList
 * Optimizado con React.memo para evitar re-renders innecesarios cuando el padre se actualiza.
 */
function HistoryListComponent({ items }: Props) {
    if (items.length === 0) return null

    return (
        <div className="glass rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historial reciente
            </h2>

            <ul className="space-y-2" role="list" aria-label="Historial de URLs acortadas">
                {items.map((item) => (
                    <li
                        key={item.short_code}
                        className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors group"
                    >
                        <div className="min-w-0 flex-1">
                            <a
                                href={item.short_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-mono text-xs font-semibold block transition-colors"
                            >
                                {item.short_url}
                            </a>
                            <p className="text-slate-500 dark:text-slate-400 text-xs truncate mt-0.5">{item.original_url}</p>
                        </div>
                        <span className="shrink-0 text-slate-700 text-xs tabular-nums">
                            {formatDate(item.createdAt)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default memo(HistoryListComponent)
