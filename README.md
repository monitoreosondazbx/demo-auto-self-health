# Portal de Automatización de VMs

Portal web para aprovisionamiento automatizado de máquinas virtuales sobre VMware vCenter/vSphere, orquestado por n8n.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query v5

---

## Arquitectura

```
Navegador
   │  POST /api/deploy (formulario)
   ▼
Next.js (este servicio)
   │  POST webhook n8n  ──────────────────────→  n8n
   │                                              │
   │  SSE stream ←── GET /api/deploy/callback ───┘
   ▼                  (n8n llama por cada fase)
Stepper en tiempo real
```

El portal actúa como **proxy SSE**: recibe el formulario del usuario, lanza el workflow de n8n, y mantiene una conexión de eventos en tiempo real hacia el navegador. n8n va reportando el progreso fase por fase mediante llamadas HTTP al endpoint `/api/deploy/callback`.

---

## Prerrequisitos

| Requisito | Versión mínima |
|---|---|
| Docker | 24.x |
| Docker Compose | v2.20 |
| n8n | Self-hosted con acceso a red de vCenter |
| Acceso de red | n8n debe poder alcanzar la IP de este servidor en el puerto 3000 |

---

## Configuración rápida

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd demo-self-health
```

### 2. Crear el archivo de variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con los valores reales:

```env
# Webhook GET — inventario de vSphere (hosts, datastores, templates, etc.)
N8N_VSPHERE_URL=https://n8n.tudominio.org/webhook/get-vmware-inventory

# Webhook POST — dispara la creación de la VM
N8N_DEPLOY_URL=https://n8n.tudominio.org/webhook/create-vm

# IP de red de ESTE servidor visible desde n8n
# n8n necesita hacer POST a esta IP para reportar progreso
APP_CALLBACK_URL=http://172.32.3.54:3000
```

> **Importante:** `APP_CALLBACK_URL` debe ser la IP real de la máquina host en la red donde corre n8n. No usar `localhost` ni `127.0.0.1` — n8n no podría alcanzarlo.

### 3. Levantar el servicio

```bash
docker compose up -d --build
```

El primer build tarda 2–3 minutos mientras instala dependencias y compila Next.js. Los builds siguientes usan caché de Docker y son mucho más rápidos.

### 4. Verificar que está corriendo

```bash
docker compose ps
```

```bash
# Ver logs en tiempo real
docker compose logs -f vm-portal
```

El portal estará disponible en: **http://\<IP-del-servidor\>:3000**

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `N8N_VSPHERE_URL` | Sí | URL del webhook GET de n8n que devuelve el inventario de vSphere |
| `N8N_DEPLOY_URL` | Sí | URL del webhook POST de n8n que arranca el workflow de creación |
| `APP_CALLBACK_URL` | Sí | URL base de este servidor, accesible desde la red de n8n |

---

## Comandos útiles

```bash
# Levantar en primer plano (ver logs directamente)
docker compose up --build

# Detener el servicio
docker compose down

# Reconstruir la imagen tras cambios en el código
docker compose up -d --build

# Ver logs del contenedor
docker compose logs -f vm-portal

# Entrar al contenedor (debug)
docker compose exec vm-portal sh
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── deploy/          # POST → lanza n8n + SSE stream al cliente
│   │   └── deploy/callback/ # POST ← n8n reporta progreso por fase
│   ├── provision/           # Página del formulario de creación de VM
│   └── infrastructure/      # Explorador de infraestructura vSphere
├── components/
│   ├── smart/               # Containers con estado y lógica de negocio
│   └── dumb/                # Componentes puramente presentacionales
├── hooks/                   # useDeployStream, useVsphereInfrastructure
├── lib/                     # jobStore (estado SSE en memoria), utilidades
└── types/                   # Interfaces TypeScript estrictas
```

---

## Flujo de aprovisionamiento

1. El usuario completa el formulario en `/provision` (nombre VM, template, host, datastore, red, IP, CPU/RAM/Disco)
2. El frontend hace `POST /api/deploy` con el payload
3. El servidor registra el job en memoria y dispara el webhook de n8n de forma asíncrona
4. El frontend abre una conexión SSE y muestra el stepper de progreso
5. n8n ejecuta el workflow en secuencia y llama a `/api/deploy/callback?jobId=<uuid>` en cada fase:
   - **Fase 1 (20–40%):** Validación de recursos y nombres en vCenter
   - **Fase 2 (41–60%):** Clonación de la VM desde la plantilla
   - **Fase 3 (61–80%):** Encendido y espera de VMware Tools
   - **Fase 4 (81–100%):** Configuración de red (netplan) y verificación SSH
6. El stepper se actualiza en tiempo real con el progreso y tiempo por fase

---

## Notas de red

- El contenedor expone el puerto **3000**. Si se cambia, actualizar también `APP_CALLBACK_URL`.
- Si n8n corre detrás de HTTPS con certificado autofirmado, el proxy Next.js ya tiene el bypass de TLS configurado (`rejectUnauthorized: false`).
- Para múltiples instancias del portal en paralelo (ej. detrás de un balanceador), el `jobStore` en memoria necesitaría migrarse a Redis. Para uso con un solo proceso (el caso habitual con Docker Compose), funciona sin dependencias externas.

---

## Desarrollo local (sin Docker)

```bash
# Instalar pnpm si no está disponible
npm install -g pnpm@9

# Instalar dependencias
pnpm install

# Levantar en modo desarrollo (hot reload)
pnpm dev
```

El servidor de desarrollo estará en `http://localhost:3000`.
