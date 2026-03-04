import { memo } from 'react'
import type { HistoryItem } from '@/types/url'
import { Link } from 'react-router-dom'

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
        <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-sm">
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Actividad Reciente
            </h2>

            <ul className="space-y-3" role="list" aria-label="Historial de URLs acortadas">
                {items.map((item) => (
                    <li
                        key={item.shortCode}
                        className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                    >
                        <div className="min-w-0 flex-1">
                            <Link
                                target='_blank'
                                to={`/${item.shortCode}`}
                                rel="noopener noreferrer"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-sm block transition-colors truncate"
                            >
                                {item.shortUrl}
                            </Link>
                            <p className="text-slate-500 dark:text-slate-500 text-[10px] font-medium truncate mt-0.5 italic">
                                {item.originalUrl}
                            </p>
                        </div>
                        <span className="shrink-0 text-slate-400 dark:text-slate-600 text-[10px] font-bold tabular-nums bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                            {formatDate(item.createdAt)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default memo(HistoryListComponent)
