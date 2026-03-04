# Spot2 URL Shortener — Backend

> Desafío técnico Spot2 · API REST en Laravel 12 para acortar URLs.

## Stack

| Tecnología | Versión | Rol |
|---|---|---|
| PHP | 8.2+ | Runtime |
| Laravel | 12.x | Framework |
| MySQL | 8.4 | Base de datos (fuente de verdad) |
| Redis | Alpine | Caché de redirecciones |
| Docker / Laravel Sail | 1.41 | Entorno de desarrollo |
| PHPUnit | 11.x | Testing (TDD) |

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) corriendo
- PHP 8.2+ (solo para el primer `composer install`)
- Composer

---

## Setup Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/huelmoandres/spot-2-url-shortener.git
cd spot2-url-shortener/backend
```

### 2. Copiar variables de entorno

```bash
cp .env.example .env
```

### 3. Instalar dependencias PHP

```bash
composer install
```

### 4. Levantar el entorno con Sail (Docker)

```bash
./vendor/bin/sail up -d
```

Esto levanta tres contenedores:
- `laravel.test` — Aplicación PHP (puerto 80)
- `mysql` — MySQL 8.4 (puerto 3306)
- `redis` — Redis Alpine (puerto 6379)

### 5. Generar clave de aplicación

```bash
./vendor/bin/sail artisan key:generate
```

### 6. Correr migraciones y seeders

```bash
# Solo migraciones
./vendor/bin/sail artisan migrate

# Con datos de ejemplo (10 URLs)
./vendor/bin/sail artisan migrate --seed
```

### 7. Verificar que el servidor responde

```bash
curl http://localhost/up
# Respuesta esperada: 200 OK
```

---

## API Reference

### `POST /api/shorten` — Acortar una URL

**Request:**
```bash
curl -X POST http://localhost/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com/maps/restaurantes-cdmx"}'
```

**Response `201 Created`:**
```json
{
    "short_code": "aBc3mNp",
    "short_url": "http://localhost/aBc3mNp",
    "original_url": "https://www.google.com/maps/restaurantes-cdmx"
}
```

**Validaciones:**
- `url` es requerido
- Debe ser una URL válida con protocolo (`http://` o `https://`)
- Máximo 2048 caracteres
- Rate limit: 60 requests/minuto por IP

**Errores:**

| Status | Causa |
|---|---|
| `422` | URL inválida o faltante |
| `429` | Rate limit excedido |

---

### `GET /{shortCode}` — Redirigir a URL original

```bash
curl -v http://localhost/aBc3mNp
# → HTTP 302 Location: https://www.google.com/maps/restaurantes-cdmx
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `302 Found` | Redirección exitosa |
| `404 Not Found` | Código inexistente |

---

## Documentación OpenAPI (Swagger)

La API tiene documentación interactiva generada automáticamente con **l5-swagger** (OpenAPI 3.0).

Con el servidor corriendo (`./vendor/bin/sail up -d`), acceder a:

```
http://localhost/api/documentation
```

Desde ahí podés explorar y probar todos los endpoints directamente en el browser sin necesidad de Postman.

Para regenerar la documentación manualmente:
```bash
./vendor/bin/sail artisan l5-swagger:generate
```

---


```bash
# Correr todos los tests
./vendor/bin/sail artisan test

# Por suite
./vendor/bin/sail artisan test --testsuite=Unit
./vendor/bin/sail artisan test --testsuite=Feature

# Un test específico
./vendor/bin/sail artisan test --filter=ShortenUrlTest

# Con cobertura (requiere Xdebug)
./vendor/bin/sail artisan test --coverage
```

**Resultado esperado:**
```
PASS  Tests\Unit\ShortCodeGeneratorServiceTest   (5 tests)
PASS  Tests\Feature\RedirectUrlTest              (5 tests)
PASS  Tests\Feature\ShortenUrlTest               (8 tests)
Tests: 18 passed (532 assertions) — Duration: ~0.7s
```

---

## Arquitectura

### Flujo de acortamiento (`POST /api/shorten`)

```
Cliente → POST /api/shorten
         → ShortenUrlRequest (validación)
         → UrlController::shorten()
         → UrlService::shorten()
            → ShortCodeGeneratorService::generate() [Base58, 7 chars]
            → Url::create() [MySQL]
            → Cache::put() [Redis, TTL 24h]
         ← 201 JSON {short_code, short_url, original_url}
```

### Flujo de redirección (`GET /{shortCode}`)

```
Cliente → GET /aBc3mNp
         → UrlController::redirect()
         → UrlService::resolve()
            → Cache::remember() [Redis primero]
              → Cache hit:  retorna URL origin en ~0.1ms
              → Cache miss: Url::where() [MySQL] → guarda en Redis
            → Url::increment('click_count') [atómico]
         ← 302 Location: https://url-original.com
```

### Decisión SQL vs NoSQL

**MySQL** (fuente de verdad):
- Garantía ACID: no se pierden URLs aunque el servidor se caiga
- Índice `UNIQUE` en `short_code` previene duplicados a nivel de DB
- Soporte nativo para `click_count` con operaciones atómicas (`INCREMENT`)

**Redis** (caché de redirecciones):
- Redirecciones en ~0.1ms vs ~5ms en MySQL
- `Cache::remember()` implementa cache-aside pattern automáticamente
- TTL de 24h — balance entre frescura y performance

**¿Por qué no solo Redis?** Riesgo de pérdida de datos si Redis se reinicia sin AOF persistence. Las URLs son datos críticos que deben persistir.

### Algoritmo Base58

Se elimina `0`, `O`, `1`, `l`, `I` del alfabeto Base62 para evitar ambigüedad visual:

```
Alfabeto: abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789
Longitud: 7 caracteres
Combinaciones: 58^7 = 2,207,984,167,552 (~2.2 billones)
```

Anti-colisión en dos capas:
1. Verificación previa en PHP (`!Url::where('short_code')->exists()`)
2. Constraint `UNIQUE` en MySQL como red de seguridad final

---

## Estructura del Proyecto

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/UrlController.php       # Thin controller
│   │   └── Requests/ShortenUrlRequest.php      # Validación de entrada
│   ├── Models/Url.php                          # Modelo Eloquent
│   └── Services/
│       ├── ShortCodeGeneratorService.php       # Generación Base58
│       └── UrlService.php                      # Lógica de negocio
├── database/
│   ├── factories/UrlFactory.php
│   ├── migrations/*_create_urls_table.php
│   └── seeders/{DatabaseSeeder,UrlSeeder}.php
├── routes/
│   ├── api.php     # POST /api/shorten
│   └── web.php     # GET /{shortCode} (raíz, sin prefijo)
├── tests/
│   ├── Feature/{RedirectUrlTest,ShortenUrlTest}.php
│   └── Unit/ShortCodeGeneratorServiceTest.php
├── docs/
│   ├── postman/                 # Colección y environment Postman
│   ├── backend-changes.md       # Historial de cambios
│   └── qa.md                    # Q&A técnico para entrevista
├── config/cors.php              # CORS para frontend
├── ai-rules.md                  # Reglas de contexto IA
└── compose.yaml                 # Docker Compose (Sail)
```

---

## Comandos Útiles

```bash
# Detener contenedores
./vendor/bin/sail down

# Ver logs en tiempo real
./vendor/bin/sail artisan pail

# Acceder a MySQL
./vendor/bin/sail mysql

# Acceder a Redis CLI
./vendor/bin/sail redis-cli

# Formatear código (PSR-12)
./vendor/bin/sail exec laravel.test ./vendor/bin/pint

# Limpiar caché de configuración
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
```

---

## Colección Postman

Importar desde `docs/postman/`:

1. `spot2-url-shortener.collection.json`
2. `spot2-url-shortener.environment.json`

Seleccionar el environment **"Spot2 URL Shortener — Local"** antes de ejecutar.

> **Tip:** Para ver el HTTP 302 nativo, desactivar *"Automatically follow redirects"* en la config del request.

---

## Seguridad

| Amenaza | Mitigación |
|---|---|
| SQL Injection | Eloquent ORM con prepared statements |
| Códigos predecibles | `random_int()` criptográficamente seguro + Base58 |
| Colisiones | Verificación en PHP + `UNIQUE` constraint en MySQL |
| XSS | Laravel escapa todos los outputs por defecto |
| CSRF | API stateless — no hay cookies de sesión |
| Abuso | Rate limiting: 60 req/min por IP via `throttle` middleware |
