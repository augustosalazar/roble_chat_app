# Roble Chat Demo

Aplicación web de demostración (React + Vite) que conecta con los servicios de **Roble** (autenticación, base de datos y tiempo real) para simular un chat multiusuario en tiempo real.

## Características

- Autenticación real contra Roble (`login`, `register`, `refresh-token`).
- Sala general de chat donde todos los usuarios autenticados conversan en tiempo real.
- Mensajes directos (DM) entre usuarios del sistema.
- Lista de usuarios obtenida mediante `execute-query` sobre una consulta configurable.
- Interfaz tipo WhatsApp: burbujas agrupadas, separadores de fecha, indicadores de conexión del WebSocket y contador de no leídos.
- WebSocket con reconexión automática y renovación de token (refresh).

## Stack

- React 19 + Vite 7
- Tailwind CSS 4
- Socket.IO Client 4
- Axios + `axios-auth-refresh`

## Prerrequisitos

- Node.js >= 20
- Contrato (project) creado en Roble con los servicios de auth, base de datos y realtime habilitados.
- Un ID de consulta (`execute-query`) que devuelva la lista de usuarios del sistema.

## Configuración

Copia el archivo `.env_sample` como `.env` y ajusta los valores:

```bash
cp .env_sample .env
```

| Variable | Descripción |
|---|---|
| `VITE_BASE_HOST` | Host del servicio de autenticación y de base de datos (execute-query) de Roble. |
| `VITE_PROJECT_ID` | ID del contrato (project) en Roble. |
| `VITE_REALTIME_HOST` | Host del servicio de tiempo real de Roble. Solo lo usan las capas de proxy (dev y Docker), no el frontend. |
| `VITE_ID_CONSULTA_LISTA_USUARIOS` | ID de la consulta que trae la lista de usuarios del sistema. |

## Instalación y desarrollo

```bash
npm install
npm run dev
```

La app corre por defecto en `http://localhost:5173`. Si el puerto está ocupado:

```bash
npm run dev -- --port 5174
```

### Proxy de desarrollo

En desarrollo, el frontend usa **rutas relativas** y el servidor de Vite hace de proxy hacia los servicios de Roble para evitar problemas de CORS:

| Ruta | Destino |
|---|---|
| `/auth/*` | `VITE_BASE_HOST` |
| `/database/*` | `VITE_BASE_HOST` |
| `/realtime/*` | `VITE_REALTIME_HOST` |
| `/socket.io/*` | `VITE_REALTIME_HOST` (con soporte WebSocket) |

## Endpoints que consume

- Autenticación: `{VITE_BASE_HOST}/auth/{contractId}/login`, `/register`, `/refresh-token`
- Base de datos: `{VITE_BASE_HOST}/database/{contractId}/execute-query`
- Realtime (REST): `{VITE_REALTIME_HOST}/realtime/data/{contractId}/messages/{chatId}`
- Realtime (WebSocket): namespace `/realtime` sobre el engine de Socket.IO en `/socket.io`

## Build de producción

```bash
npm run build
npm run preview
```

### Despliegue con Docker

> Nota: `VITE_REALTIME_HOST` no se usa en el build del frontend. Solo se pasa en el `docker run` como variable de entorno para que nginx (proxy) reenvíe el WebSocket del realtime.

```bash
docker build -t roble-chat-demo \
  --build-arg VITE_BASE_HOST=https://roble-api.test-openlab.uninorte.edu.co \
  --build-arg VITE_PROJECT_ID=tu_contrato_id \
  --build-arg VITE_ID_CONSULTA_LISTA_USUARIOS=tu_consulta_id \
  .

docker run -p 8080:80 \
  -e VITE_BASE_HOST=https://roble-api.test-openlab.uninorte.edu.co \
  -e VITE_REALTIME_HOST=https://roble-realtime.test-openlab.uninorte.edu.co \
  roble-chat-demo
```

La imagen expone nginx en el puerto `80`, sirve los estáticos y hace de proxy (HTTP y WebSocket) hacia los servicios de Roble.

## Estructura del proyecto

```
src/
├── components/   # UI: ChatSidebar, Header, MessageList, MessageInput, Toast, Login/Register, ProtectedRoute
├── pages/        # LoginPage, RegisterPage, ChatPage
└── services/     # api (auth), realtime, users (execute-query), chatState (no leídos)
```

## Notas

- El JWT devuelto por login contiene el campo `dbName`, que debe coincidir con `VITE_PROJECT_ID` para que el servicio realtime autorice la suscripción.
- Los mensajes se guardan por chat en la colección `messages/{chatId}` del servicio realtime.
