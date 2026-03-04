/**
 * tailwind.config.ts — Tailwind CSS v4
 *
 * En v4, el sistema de diseño (colores, tipografía, animaciones) se define
 * íntegramente en index.css usando el bloque @theme {}.
 * Este archivo solo gestiona la detección de contenido y el modo oscuro.
 */
import type { Config } from 'tailwindcss'

export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
} satisfies Config
