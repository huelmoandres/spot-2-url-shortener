import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ui/ThemeToggle'
import HomePage from '@/pages/HomePage'
import RedirectPage from '@/pages/RedirectPage'
import UrlsPage from '@/pages/UrlsPage'

// App es solo el shell: routing + elementos globales de UI
export default function App() {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl font-medium'
        }}
      />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/urls" element={<UrlsPage />} />
        <Route path="/:shortCode" element={<RedirectPage />} />
      </Routes>
    </>
  )
}
