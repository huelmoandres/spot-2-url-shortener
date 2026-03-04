# Guía del Pipeline CI/CD (GitHub Actions)
# Para defensa técnica en entrevista

> El archivo `.github/workflows/backend-ci.yml` implementa el proceso de **Integración Continua (CI)**. Su objetivo es garantizar que cada cambio subido al repositorio sea estable, cumpla con los estándares de estilo y no rompa ninguna funcionalidad existente.

---

## 1. Disparadores (Triggers)
```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
```
- **Branches:** Se ejecuta automáticamente cuando hay un `push` o un `pull request` hacia `main` o `develop`.
- **Paths Filter:** Solo se dispara si hay cambios dentro de la carpeta `/backend`. Esto ahorra tiempo y recursos si solo se modifica el frontend.

---

## 2. Estrategia de Matrix
```yaml
strategy:
  matrix:
    php: ['8.2', '8.3']
```
El pipeline corre **dos veces en paralelo**: una vez usando PHP 8.2 y otra con PHP 8.3. Esto asegura que el código es compatible con las versiones más estables y utilizadas de PHP actualmente.

---

## 3. Servicios (Infrastructure-as-Code)
El pipeline levanta contenedores Docker reales para simular el entorno de producción:
- **MySQL 8.4:** Base de datos relacional para persistencia.
- **Redis Alpine:** Base de datos en memoria para la capa de caché.
- Ambos servicios incluyen "Health Checks" para asegurar que están listos antes de que comiencen los tests.

---

## 4. El Job de Pruebas (`tests`)

### Pasos principales:
1. **Checkout code:** Descarga el código del repositorio.
2. **Setup PHP:** Configura el entorno de PHP con las extensiones necesarias (`pdo_mysql`, `redis`, `mbstring`).
3. **Cache Composer:** Almacena la carpeta `vendor`. Si no hay cambios en `composer.lock`, la descarga es instantánea en el próximo run.
4. **Copy .env for CI:** Usa el `.env.example` y lo modifica mediante comandos `sed` para apuntar a los servicios de MySQL y Redis propios del pipeline (`127.0.0.1`).
5. **Run database migrations:** Verifica que las migraciones (`up` y `down`) sean válidas y creen la estructura de tablas correctamente.
6. **Run PHPUnit tests:** Ejecuta los 18 tests. Si un solo test falla, el pipeline se pone en rojo y bloquea el merge.

---

## 5. El Job de Estilo (`lint`)
```yaml
run: ./vendor/bin/pint --test
```
Este job es independiente y rápido. Usa **Laravel Pint** para verificar que el código respeta el estándar oficial de Laravel. Si alguien sube código mal formateado o con imports innecesarios, este paso fallará.

---

## 6. ¿Por qué esto es Nivel Senior?

Si te preguntan por qué agregaste esto siendo un "bonus":

1. **Confianza en el despliegue:** "Ningún código llega a producción sin antes pasar por la batería de tests y el linter".
2. **Automatización:** "No dependo de que el desarrollador se acuerde de correr `./vendor/bin/sail artisan test` localmente; el servidor lo garantiza".
3. **Escalabilidad del equipo:** "Un pipeline de CI permite que varios desarrolladores trabajen en paralelo sin miedo a romper el trabajo de otros".
4. **Resistencia a errores de plataforma:** "Tener una matrix de PHP (8.2/8.3) previene bugs silenciosos que solo ocurren en versiones específicas de PHP".

---

## Preguntas típicas de entrevista:

**P: ¿Por qué usas SQLite `:memory:` para los tests si el CI levanta un MySQL?**
R: Porque los tests unitarios y de feature deben ser lo más rápidos posible. SQLite `:memory:` es ideal para velocidad. Sin embargo, tener el servicio MySQL en el CI permite hacer tests de integración más pesados si fuera necesario o verificar que las migraciones son compatibles con el motor de base de datos final.

**P: ¿Qué pasaría si el job de `lint` falla pero el de `tests` pasa?**
R: El commit se marca como fallido. Esto mantiene la deuda técnica baja y el código limpio, forzando al equipo a seguir las mismas reglas de estilo.
