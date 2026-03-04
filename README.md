# Spot2 Tech Challenge — URL Shortener

Solución completa para el desafío técnico de Spot2. Implementa un acortador de URLs con API RESTful, SPA y pipeline de CI/CD.

**Stack:** Laravel 12 · PHP 8.2+ · MySQL 8.4 · Redis · React 19 · TypeScript · Tailwind CSS v4 · Vite 7

---

## Arquitectura

El proyecto está compuesto por dos aplicaciones independientes que se comunican a través de HTTP, simulando una arquitectura real de producto:

```
 Browser / SPA (React + Vite)
         │  HTTP (REST)
         ▼
 Laravel API  ──── Redis  (caché, TTL 24h, patrón Cache-Aside)
         │
       MySQL  (fuente de verdad)
```

| App | Ruta | Puerto dev |
|-----|------|------------|
| Backend API | `/backend` | `http://localhost` (Docker) |
| Frontend SPA | `/frontend` | `http://localhost:5173` (Vite) |

Documentación técnica detallada del backend en [`backend/docs/ARCHITECTURE.md`](backend/docs/ARCHITECTURE.md).

---

## Backend (`/backend`)

- **Laravel 12 / PHP 8.2+** con `declare(strict_types=1)` en todo el codebase.
- Endpoint de creación idempotente: la misma URL siempre devuelve el mismo código corto.
- Generación de código con **Base58** (7 chars) usando `random_int()` — criptográficamente seguro.
- **Cache-Aside con Redis**: redirecciones resueltas desde Redis en sub-milisegundo; fallback a MySQL solo en cache miss. Sin cache poisoning de valores nulos.
- **Rate limiting** por IP: 60/min en POST, 120/min en GET, 30/min en DELETE.
- **25 tests** (606 assertions) cubriendo todos los endpoints, edge cases de caché y validaciones de seguridad.
- Documentación OpenAPI/Swagger en `http://localhost/api/documentation`.

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/shorten` | Crear enlace corto (idempotente) |
| `GET` | `/api/urls` | Listar URLs paginadas y filtrables |
| `DELETE` | `/api/urls/{shortCode}` | Eliminar URL y limpiar caché |
| `GET` | `/{shortCode}` | Redirigir → 302 (sin prefijo `/api/`) |

---

## Frontend (`/frontend`)

- **React 19 + TypeScript + Tailwind CSS v4** con sistema de diseño atómico (shadcn/ui approach).
- Componentes base reutilizables: `Button` (CVA + 7 variantes), `Input`, `Card` con `forwardRef` y `HTMLAttributes` extendidos.
- `class-variance-authority` + `tailwind-merge` + `clsx` para gestión de variantes sin colisiones.
- Path aliases `@/` configurados en `tsconfig.app.json` + `vite.config.ts`.
- Design system centralizado en `index.css` con `@theme {}` de Tailwind v4 (paleta corporativa, animaciones, capas `base`/`utilities`).
- Dark mode controlado por clase (`.dark`), persistido en `localStorage`.
- React Query para fetching, caché y sincronización de datos.
- Layout de pantalla dividida responsive (`lg:grid-cols-2`).

---

## Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine en Linux).
- [Node.js 20+](https://nodejs.org/).
- [Composer](https://getcomposer.org/) (opcional si se usa Sail para todo).

---

## Instalación y ejecución local

### 1. Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias PHP (via Docker si no tienes PHP local)
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs

# Levantar contenedores (Laravel + MySQL 8.4 + Redis)
./vendor/bin/sail up -d

# Preparar la aplicación
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
```

El backend queda disponible en `http://localhost`.
Swagger UI en `http://localhost/api/documentation`.

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

---

## Tests

### Backend

```bash
cd backend
./vendor/bin/sail artisan test
# o sin Docker:
php artisan test
```

```
Tests:    25 passed (606 assertions)
Duration: ~0.4s
```

### Frontend

```bash
cd frontend
npm run lint   # ESLint
npm run build  # tsc -b && vite build
```

---

## CI/CD

Dos pipelines en GitHub Actions que se activan en cada `push`/PR a `main`:

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `backend-ci.yml` | `backend/**` | **tests** (PHP 8.2/8.3/8.4/8.5 en matriz) + **lint** (Laravel Pint) |
| `frontend.yml` | `frontend/**` | **build-and-lint** (ESLint + `tsc -b` + Vite build) |

---

## Estructura del proyecto

```
spot2-url-shortener/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/UrlController.php
│   │   │   ├── Requests/ShortenUrlRequest.php
│   │   │   ├── Requests/GetUrlsQueryRequest.php
│   │   │   └── Resources/UrlResource.php
│   │   ├── Models/Url.php
│   │   └── Services/
│   │       ├── UrlService.php
│   │       └── ShortCodeGeneratorService.php
│   ├── docs/
│   │   └── ARCHITECTURE.md        ← decisiones técnicas detalladas
│   ├── routes/
│   │   ├── api.php                ← POST /shorten, GET/DELETE /urls
│   │   └── web.php                ← GET /{shortCode} (sin prefijo /api/)
│   └── tests/Feature/             ← 25 tests, 606 assertions
│
├── frontend/
│   ├── src/
│   │   ├── components/ui/         ← Button, Input, Card, Spinner, Skeleton…
│   │   ├── hooks/                 ← useUrlShortener, useUrls, useHistory…
│   │   ├── pages/                 ← HomePage, UrlsPage, RedirectPage
│   │   └── services/url.service.ts
│   └── src/index.css              ← @theme {} design system tokens
│
└── .github/workflows/
    ├── backend-ci.yml
    └── frontend.yml
```

---

_Desarrollado para el Tech Challenge de Spot2 · Andrés Huelmo_
