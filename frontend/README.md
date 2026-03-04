# Spot2 Tech Challenge - Frontend

Esta es la aplicación cliente (SPA) desarrollada para el Tech Challenge de Spot2. Su objetivo es consumir el API del Shortener y ofrecer una interfaz impecable, moderna y ultra-rápida.

## 🚀 Tecnologías Principales

- **React 19** (Librería UI base)
- **TypeScript** (Tipado estático robusto)
- **Vite** (Bundler ultrarrápido)
- **Tailwind CSS 4** (Framework de estilos de utilidad)
- **React Router v7** (Enrutamiento del lado del cliente)
- **Zod & React Hook Form** (Validación predictiva de formularios)
- **Zustand / Hooks Personalizados** (Manejo de estado simplificado)

## 📁 Estructura del Proyecto

El código está organizado de manera modular, siguiendo mejores prácticas de "Feature-first":

```text
src/
├── components/     # Componentes visuales genéricos y de dominio (UI, Layout, History, etc)
├── contexts/       # Proveedores de contexto global (ej. ThemeContext para Dark Mode)
├── hooks/          # Hooks personalizados que albergan toda la lógica de negocio (useUrlShortener)
├── lib/            # Configuraciones de bibliotecas de terceros (Axios, React Query)
├── pages/          # Vistas principales responsables del routing
├── schemas/        # Esquemas de validación Zod (ej. validación de URL)
└── types/          # Definiciones de TypeScript e interfaces comunes compartidas
```

## ✨ Características Destacables

1. **Light & Dark Mode**: Un conmutador de temas inteligente implementado con `Context` que persiste la elección del usuario en `localStorage`. Toda la UI (incluidos efectos _Glassmorphism_ avanzados) se adapta orgánicamente gracias a la directiva `dark:` de Tailwind CSS.
2. **Historial Persistente**: Las URLs que el usuario acorta persisten en caché del navegador (Local Storage) manteniéndolas disponibles entre sesiones.
3. **Manejo Excepcional de Errores**: Uso de un componente `ErrorBoundary` para evitar la Pantalla Blanca de la Muerte en React. Feedback en tiempo real para URLs inválidas gracias a `Zod`.
4. **CI/CD Integrado**: Configurado con GitHub Actions que revisa análisis de código estático (ESLint) y de tipos (TypeScript) en cada solicitud de fusión o push a la rama `main`.
5. **Animaciones Fluidas**: Animaciones en CSS puro en `index.css` que dan feedback en las transiciones y validaciones del formulario, manteniendo la retención y foco del usuario.

## 💻 Configuración Local

Si has llegado hasta aquí desde la raíz principal, asegúrate de levantar el **Backend** primero.

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Ejecuta el entorno de desarrollo:
   ```bash
   npm run dev
   ```

3. Ingresa tu navegador web en `http://localhost:5173` o `http://localhost:5174` para comenzar.

## 🔗 Variables de Entorno

Puedes configurar el acceso base a tu API en caso de que necesites un endpoint diferente, usando un archivo `.env` en la raíz de `frontend/`:

```env
VITE_API_URL=http://localhost/api
VITE_BACKEND_URL=http://localhost
```

_Por defecto, tomará `http://localhost` para las rutas si no declaras un `.env`._
