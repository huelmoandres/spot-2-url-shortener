import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ThemeToggle from './components/ui/ThemeToggle'
import HomePage from './pages/HomePage'
import RedirectPage from './pages/RedirectPage'

// App es solo el shell: routing + elementos globales de UI
export default function App() {
  return (
    <>
      <Toaster position="bottom-center" toastOptions={{ className: 'glass text-slate-200' }} />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:shortCode" element={<RedirectPage />} />
      </Routes>
    </>
  )
}
