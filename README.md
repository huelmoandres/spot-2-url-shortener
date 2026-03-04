# Spot2 Tech Challenge - URL Shortener

Bienvenido/a al repositorio de la solución para el desafío técnico de Spot2. Este proyecto implementa un acortador de URLs completo y moderno, compuesto por un API backend escalable en **Laravel (PHP)** y una SPA robusta y estilizada en **React (TypeScript)**.

## 🚀 Arquitectura del Proyecto

El proyecto está dividido en dos aplicaciones principales que operan de forma independiente (API y Cliente), simulando una arquitectura moderna enfocada en separar el dominio y la presentación:

* **`/backend`**: Una API HTTP desarrollada en Laravel 11. 
  * Expone la creación de URLs cortas (`POST /api/shorten`).
  * Implementa un redireccionador HTTP 302 hacia las URLs originales (`GET /{shortCode}`).
  * Usa **Redis** como capa de caché (patrón *Cache-Aside*) para optimizar los tiempos de resolución de las URLs y soportar altos volúmenes de consultas.
  * Usa **MySQL** como base de datos persistente.
  * Encapsulado por completo en Docker mediante Laravel Sail.

* **`/frontend`**: Una Single Page Application (SPA) construida con React, Vite y TypeScript.
  * Permite ingresar URLs para acortarlas a través del API.
  * Guarda historial local, cuenta con un manejador de estado y maneja temas (`Dark/Light mode`).
  * Usa variables de entorno para su configuración y está comprobado con flujos de **CI/CD** usando GitHub Actions para linters.

---

## 🛠 Prerrequisitos

Para ejecutar este proyecto en un entorno local, asegúrate de contar con lo siguiente instalado en tu máquina:

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o el motor de Docker nativo si estás en Linux).
2. [Node.js](https://nodejs.org/) (versión 20 o superior).
3. [Composer](https://getcomposer.org/) (opcional, aunque recomendado si vas a depurar dependencias PHP fuera de Sail).

---

## 💻 Guía de Instalación y Ejecución Local

Sigue estos pasos en el orden detallado para levantar ambos proyectos concurrentemente.

### 1. Levantar el Backend (API)

Dirígete a la carpeta del backend. El backend usa **Laravel Sail**, lo cual te ahorra tener que configurar PHP, Nginx, Redis y MySQL en tu propia computadora:

```bash
cd backend

# Copiar el archivo de variables de entorno base
cp .env.example .env

# (Opcional) Si no tienes las dependencias de vendor instaladas localmente y
# quieres usar un contenedor temporal para instalarlas la primera vez:
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs

# Levantar los contenedores de Docker en segundo plano
./vendor/bin/sail up -d
```

Una vez que los contenedores estén corriendo (demora unos segundos la primera vez al descargar imágenes de MySQL y Redis), ejecuta los siguientes comandos para preparar la base de datos:

```bash
# Generar la llave de cifrado de la aplicación
./vendor/bin/sail artisan key:generate

# Correr las migraciones para crear la tabla `urls`
./vendor/bin/sail artisan migrate
```

¡Listo! El backend de Laravel está ahora funcionando en `http://localhost`.

### 2. Levantar el Frontend (React)

En una nueva pestaña/ventana de tu terminal, dirígete a la carpeta del frontend:

```bash
cd frontend

# Instalar dependencias del proyecto de React
npm install

# Iniciar el servidor de desarrollo de Vite
npm run dev
```

El frontend estará levantado y funcionando, por defecto en `http://localhost:5173` o `http://localhost:5174` (usualmente React te lo indicará en la consola). 

---

## 🧪 Cómo Pruebo la Aplicación

1. **Abre el Frontend:** En tu navegador, ingresa a `http://localhost:5173` (o la que haya devuelto el comando `npm run dev`).
2. **Crea un enlace:** En la interfaz (UI), pega un link extremadamente largo, como `https://www.google.com/maps/search/restaurantes+en+cdmx+super+detallado` y presiona en **Acortar**.
3. **Verifica:** Verás aparecer un URL muy pequeño en el dashboard (por ejemplo `http://localhost/aBc3mNp`). Si haces click allí, el `UrlController` del backend (`Route::get('/{shortCode}')`) lo interceptará; consultará a **Redis** (o a la base de datos MySQL) y ejecutará un `HTTP 302 Redirect` enviando de inmediato a tu navegador a la URL original de Google Maps.

---

## 🔍 Criterios Funcionales Cumplidos y Puntos Destacados

- **Arquitectura Limpia & SOLID:** Patrones MVC en Laravel con inyección de dependencias y servicios (`UrlService`, `ShortCodeGeneratorService`), quitando cualquier lógica de dominio gruesa del controlador.
- **Identificadores cortos reales:** El algoritmo base58 garantiza URLs de longitud sumamente reducida (7 caracteres alfanuméricos) excluyendo letras ambiguas (`0, O, l, 1`) para evitar confusiones de los humanos.
- **Mantenibilidad:** Código frontend altamente modificado y extraído a componentes pequeños y custom-hooks (`useUrlShortener`), aplicando **TypeScript** estricto y un `ErrorBoundary` para evitar fallos catastróficos. Interfaz adaptativa con TailwindCSS.
- **Preparado para Escalar:** El uso de **Redis** reduce el esfuerzo computacional sobre MySQL, acelerando el procesamiento de redirecciones. Ambas apps al ser independientes podrían escalar horizontalmente balanceando la carga en un entorno _cloud like_ (ej. Amazon ECS/EKS).
- **Integración Continua:** Configurado GitHub Actions de cara al FrontEnd (`.github/workflows/frontend.yml`) que garantiza el paso de linteo formal y testing de construcción sobre cada *Pull Request*.

🚀 _Desarrollado para el Tech Challenge._
