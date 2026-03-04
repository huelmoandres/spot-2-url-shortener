import { Button } from '@/components/ui/Button'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDanger?: boolean
    isLoading?: boolean
}

/**
 * ConfirmModal
 * Diálogo de confirmación reutilizable con sistema de diseño corporativo.
 * Usa el átomo Button para consistencia visual y de comportamiento.
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = false,
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-[2px] animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-900/20 dark:shadow-none animate-scale-in border border-slate-200 dark:border-slate-800"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="mb-6">
                    <h3
                        id="modal-title"
                        className="text-xl font-black text-slate-900 dark:text-white leading-tight"
                    >
                        {title}
                    </h3>
                    <div className={`h-1 w-12 mt-2 rounded-full ${isDanger ? 'bg-danger-500' : 'bg-primary-500'}`} />
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 uppercase tracking-widest text-xs border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {cancelText}
                    </Button>

                    <Button
                        type="button"
                        variant={isDanger ? 'destructive' : 'default'}
                        size="sm"
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className="flex-1 py-3 uppercase tracking-widest text-xs"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    )
}
