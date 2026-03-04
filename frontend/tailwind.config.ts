/**
 * tailwind.config.ts — Tailwind CSS v4
 *
 * In v4, the design tokens (colors, typography, animation) live in `index.css`
 * via `@theme`; this file only controls content scanning and dark mode.
 */
import type { Config } from 'tailwindcss'

export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
} satisfies Config
