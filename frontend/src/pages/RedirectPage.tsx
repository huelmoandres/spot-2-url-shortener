import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BACKEND_URL } from '../constants'
import Spinner from '../components/ui/Spinner'

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
                // Redirige al backend que devuelve el 302 → URL original
                window.location.href = `${BACKEND_URL}/${shortCode}`
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [shortCode, navigate])

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="glass rounded-3xl p-10 max-w-sm w-full text-center glow-indigo fade-in-up">
                {/* Spinner orbital animado */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                    <div
                        className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-400 animate-spin"
                        style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner size="sm" className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Redirigiendo</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Serás redirigido en{' '}
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">{countdown}</span>{' '}
                    segundo{countdown !== 1 ? 's' : ''}
                </p>
                <p className="text-slate-400 dark:text-slate-600 text-xs mt-4">
                    Código: <span className="font-mono text-slate-500">{shortCode}</span>
                </p>
            </div>
        </div>
    )
}
