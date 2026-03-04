import { useState } from 'react'
import { useUrls } from '@/hooks/useUrls'
import { useDebounce } from '@/hooks/useDebounce'
import Spinner from '@/components/ui/Spinner'
import { Link } from 'react-router-dom'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function UrlsPage() {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(20)
    const [search, setSearch] = useState('')
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)

    // Evita el spamming a la API cuando el usuario teclea rápido
    const debouncedSearch = useDebounce(search, 350)

    const { paginatedData, isLoading, isError, deleteUrl, isDeleting } = useUrls(page, perPage, debouncedSearch)

    const handleDelete = (shortCode: string) => {
        setItemToDelete(shortCode)
        setIsConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (itemToDelete) {
            try {
                await deleteUrl(itemToDelete)
                setIsConfirmOpen(false)
                setItemToDelete(null)
            } catch (error) {
                console.error('Error deleting URL:', error)
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter p-4 sm:p-8 flex flex-col items-center">
            <header className="w-full max-w-6xl flex justify-between items-center mb-10 animate-fade-in-up">
                <Link to="/" className="flex items-center gap-3 group transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-primary-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-slate-900/20 dark:shadow-primary-900/30 group-hover:scale-105 transition-transform">
                        S
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">Spot2</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dashboard</span>
                    </div>
                </Link>
            </header>

            <main className="w-full max-w-6xl animate-fade-in-up [animation-delay:200ms]">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    {/* Toolbar Header */}
                    <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                                Librería de Enlaces
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-semibold">
                                Gestiona el historial de tus activos digitales acortados.
                            </p>
                        </div>

                        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 sm:w-80 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 transition-colors group-focus-within:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar enlace o código..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value)
                                        setPage(1)
                                    }}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder-slate-400 dark:placeholder-slate-600 shadow-sm"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value))
                                        setPage(1)
                                    }}
                                    className="pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                >
                                    <option value={5}>5 Filas</option>
                                    <option value={20}>20 Filas</option>
                                    <option value={50}>50 Filas</option>
                                    <option value={100}>100 Filas</option>
                                </select>

                                <Link
                                    to="/"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-primary-600 hover:bg-black dark:hover:bg-primary-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Nuevo
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <Spinner size="lg" className="text-primary-600 dark:text-primary-500" />
                                <span className="mt-4 text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Sincronizando...</span>
                            </div>
                        ) : isError ? (
                            <div className="text-center py-20 bg-rose-50/30 dark:bg-rose-950/10">
                                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-rose-600 dark:text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-rose-600 dark:text-rose-400 font-bold">Error al recuperar datos</p>
                                <button onClick={() => window.location.reload()} className="mt-4 text-xs font-black text-slate-500 hover:text-slate-900 underline uppercase tracking-widest underline-offset-4">Reintentar</button>
                            </div>
                        ) : paginatedData?.data?.length === 0 ? (
                            <div className="text-center py-24 px-6">
                                <div className="w-16 h-16 mx-auto mb-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                    <svg className="w-8 h-8 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No se encontraron enlaces</h3>
                                <p className="text-slate-500 dark:text-slate-500 text-sm font-semibold max-w-xs mx-auto">
                                    {debouncedSearch ? 'No hay resultados que coincidan con tu búsqueda actual.' : 'Tu historial comercial está vacío. Comienza acortando tu primera URL.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
                                <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                                    <thead className="sticky top-0 z-20 bg-white dark:bg-slate-900">
                                        <tr>
                                            <th className="py-4 px-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Destino Original</th>
                                            <th className="py-4 px-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Enlace Corto</th>
                                            <th className="py-4 px-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Interacciones</th>
                                            <th className="py-4 px-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Fecha</th>
                                            <th className="py-4 px-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {paginatedData?.data.map((url) => (
                                            <tr key={url.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="py-5 px-8 max-w-xs">
                                                    <div className="flex flex-col">
                                                        <span
                                                            className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate cursor-default"
                                                            data-tooltip-id="url-tooltip"
                                                            data-tooltip-content={url.originalUrl}
                                                        >
                                                            {url.originalUrl}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 truncate">Propiedad SPOT2</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-8">
                                                    <Link
                                                        target='_blank'
                                                        to={`/${url.shortCode}`}
                                                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-sm transition-colors flex items-center gap-1.5"
                                                    >
                                                        <span className="text-slate-300 dark:text-slate-700">/</span>
                                                        {url.shortCode}
                                                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </Link>
                                                </td>
                                                <td className="py-5 px-8 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 tabular-nums border border-slate-200/50 dark:border-slate-700/50">
                                                        {url.clickCount} CLICS
                                                    </span>
                                                </td>
                                                <td className="py-5 px-8 text-right">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-500 tabular-nums whitespace-nowrap">
                                                        {new Date(url.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-8 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            to={`/${url.shortCode}`}
                                                            target='_blank'
                                                            className="p-2.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm active:scale-90"
                                                            data-tooltip-id="global-tooltip"
                                                            data-tooltip-content="Abrir Destino"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(url.shortCode)}
                                                            disabled={isDeleting}
                                                            className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm active:scale-90"
                                                            data-tooltip-id="global-tooltip"
                                                            data-tooltip-content="Eliminar Permanente"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {!isLoading && !isError && paginatedData && paginatedData.data.length > 0 && (
                        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 gap-4">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                                Mostrando <span className="text-slate-900 dark:text-slate-300 italic">{paginatedData.meta.from} - {paginatedData.meta.to}</span> de <span className="text-slate-900 dark:text-slate-300 italic">{paginatedData.meta.total}</span> registros
                            </span>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= paginatedData.meta.last_page}
                                    className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Premium Tooltips */}
            <Tooltip
                id="global-tooltip"
                place="top"
                className="!bg-slate-900 !text-white !rounded-lg !px-3 !py-2 !text-[10px] !font-black !shadow-2xl !opacity-100 !tracking-widest !uppercase"
            />
            <Tooltip
                id="url-tooltip"
                place="top-start"
                className="!bg-primary-600 !text-white !rounded-xl !px-4 !py-3 !text-xs !font-bold !shadow-2xl !opacity-100 !max-w-md !break-all"
                noArrow={false}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar enlace?"
                message="Esta acción es irreversible para el sistema Spot2. El enlace dejará de ser accesible para todos los usuarios."
                confirmText="Confirmar Baja"
                cancelText="Mantener Enlace"
                isDanger
                isLoading={isDeleting}
            />
        </div>
    )
}

