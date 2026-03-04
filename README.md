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
| `backend-ci.yml` | `backend/**` | **tests** (PHP 8.2/8.3/8.4/8.5 en matriz) + **lint** (Laravel Pint) + **deploy** |
| `frontend.yml` | `frontend/**` | **build-and-lint** (ESLint + `tsc -b` + Vite build) + **deploy** |

El job **deploy** solo corre en `push` a `main` (no en PRs) y ejecuta el Deploy Hook de Railway. Requiere dos secrets en el repositorio de GitHub:

| Secret | Descripción |
|--------|-------------|
| `RAILWAY_BACKEND_DEPLOY_HOOK` | URL del Deploy Hook del servicio backend en Railway |
| `RAILWAY_FRONTEND_DEPLOY_HOOK` | URL del Deploy Hook del servicio frontend en Railway |

---

## Despliegue en Railway

El proyecto incluye Dockerfiles de producción optimizados para Railway. Los servicios necesarios son:

| Servicio | Tipo | Directorio raíz |
|----------|------|-----------------|
| `backend` | Dockerfile | `backend/` |
| `frontend` | Dockerfile | `frontend/` |
| `mysql` | Plugin Railway | — |
| `redis` | Plugin Railway | — |

### Pasos para desplegar

#### 1. Crear el proyecto en Railway

1. Ir a [railway.app](https://railway.app) → **New Project**
2. Seleccionar **Empty Project**

#### 2. Agregar MySQL y Redis

1. En el proyecto, click en **+ Add Service** → **Database** → **MySQL 8**
2. Click en **+ Add Service** → **Database** → **Redis**

#### 3. Crear el servicio backend

1. **+ Add Service** → **GitHub Repo** → selecciona este repositorio
2. En la configuración del servicio → **Settings**:
   - **Root Directory:** `backend`
   - El Dockerfile se detecta automáticamente
3. En la pestaña **Variables**, agrega:

```
APP_NAME=Spot2 URL Shortener
APP_ENV=production
APP_KEY=          ← genera con: php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://<tu-dominio-backend>.up.railway.app
FRONTEND_URL=https://<tu-dominio-frontend>.up.railway.app

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}
DB_USERNAME=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}

CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

LOG_CHANNEL=stderr
LOG_LEVEL=error
```

> **Nota:** Railway permite referenciar variables de otros servicios con la sintaxis `${{Servicio.VARIABLE}}`.

#### 4. Crear el servicio frontend

1. **+ Add Service** → **GitHub Repo** → selecciona este repositorio
2. En **Settings**:
   - **Root Directory:** `frontend`
3. En **Variables** (son variables de build, ya que Vite las embebe en el bundle):

```
VITE_API_BASE_URL=https://<tu-dominio-backend>.up.railway.app/api
VITE_BACKEND_URL=https://<tu-dominio-backend>.up.railway.app
```

#### 5. Configurar CD automático desde GitHub Actions

1. En cada servicio de Railway → **Settings** → **Deploy** → **Deploy Hooks** → **Create Hook**
2. Copiar la URL generada
3. En GitHub → **Settings** → **Secrets and variables** → **Actions**:
   - Agregar `RAILWAY_BACKEND_DEPLOY_HOOK` con la URL del backend
   - Agregar `RAILWAY_FRONTEND_DEPLOY_HOOK` con la URL del frontend

A partir de ahí, cada `push` a `main` ejecuta los tests y, si pasan, lanza el deploy automáticamente.

#### 6. Generar APP_KEY

```bash
cd backend
php artisan key:generate --show
# Copia el resultado en la variable APP_KEY de Railway
```

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
│   ├── docker/                    ← Configs de producción (Nginx, Supervisor, entrypoint)
│   ├── routes/
│   │   ├── api.php                ← POST /shorten, GET/DELETE /urls
│   │   └── web.php                ← GET /{shortCode} (sin prefijo /api/)
│   ├── tests/Feature/             ← 25 tests, 606 assertions
│   ├── Dockerfile                 ← Imagen de producción (PHP-FPM + Nginx)
│   └── railway.toml               ← Configuración de despliegue Railway
│
├── frontend/
│   ├── docker/                    ← Configs de producción (Nginx, entrypoint)
│   ├── src/
│   │   ├── components/ui/         ← Button, Input, Card, Spinner, Skeleton…
│   │   ├── hooks/                 ← useUrlShortener, useUrls, useHistory…
│   │   ├── pages/                 ← HomePage, UrlsPage, RedirectPage
│   │   └── services/url.service.ts
│   ├── src/index.css              ← @theme {} design system tokens
│   ├── Dockerfile                 ← Imagen de producción (Vite build + Nginx)
│   └── railway.toml               ← Configuración de despliegue Railway
│
└── .github/workflows/
    ├── backend-ci.yml             ← CI (tests × 4 versiones PHP) + CD
    └── frontend.yml               ← CI (lint + build) + CD
```

---

_Desarrollado para el Tech Challenge de Spot2 · Andrés Huelmo_
