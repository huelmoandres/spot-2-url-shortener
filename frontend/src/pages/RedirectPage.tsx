import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BACKEND_URL } from '@/constants'

export default function RedirectPage() {
    const { shortCode } = useParams<{ shortCode: string }>()
    const navigate = useNavigate()
    const [countdown, setCountdown] = useState(2)

    useEffect(() => {
        if (!shortCode) {
            navigate('/', { replace: true })
            return
        }

        let count = 2
        const timer = setInterval(() => {
            count -= 1
            setCountdown(count)
            if (count === 0) {
                clearInterval(timer)
                window.location.href = `${BACKEND_URL}/${shortCode}`
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [shortCode, navigate])

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="animate-fade-in-up bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-sm w-full text-center border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                {/* Barra de acento superior */}
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary-500 to-indigo-600" />

                {/* Spinner orbital */}
                <div className="relative w-20 h-20 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-2 border-primary-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
                    <div
                        className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary-300 animate-spin"
                        style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary-500 animate-pulse" />
                    </div>
                </div>

                <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    Redirigiendo
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                    Serás redirigido en{' '}
                    <span className="text-primary-600 dark:text-primary-400 font-black tabular-nums text-base">
                        {countdown}
                    </span>{' '}
                    segundo{countdown !== 1 ? 's' : ''}
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                    <span className="font-mono text-slate-400 dark:text-slate-600">/</span>
                    <span className="font-mono">{shortCode}</span>
                </div>
            </div>
        </div>
    )
}
