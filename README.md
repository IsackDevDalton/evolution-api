# Wappi Gateway

Servidor de mensajería de WhatsApp para **Wappi**, producto de Novacti. Administra instancias, recibe webhooks de Meta y entrega eventos a los servicios de Wappi y Azure mediante webhooks HTTP.

## Funciones principales

- Alta y administración de instancias con `POST /instance/create` y las demás rutas de `/instance`.
- Recepción de Meta Cloud API mediante `GET /webhook/meta` (verificación) y `POST /webhook/meta` (eventos).
- Envío de mensajes mediante `/message`.
- Configuración del webhook saliente mediante `/webhook/set` y `/webhook/find`.
- Persistencia de instancias con PostgreSQL y caché con Redis.

El Manager, las rutas de Chatwoot y bots, y los conectores de eventos WebSocket, RabbitMQ, NATS, SQS, Pusher y Kafka no forman parte de la superficie HTTP activa. El repositorio conserva algunos módulos históricos para compatibilidad con instancias y esquema de datos existentes; no se debe interpretar su presencia como una integración soportada.

## Desarrollo

1. Copiar `env.example` a `.env` y establecer las credenciales y URL del entorno.
2. Instalar dependencias con `npm ci`.
3. Establecer `DATABASE_PROVIDER=postgresql` y ejecutar `npm run db:generate`.
4. Iniciar con `npm run dev:server` o construir con `npm run build`.

El archivo `docker-compose.dev.yaml` muestra el contenedor local del gateway. `docker-compose.yaml` incluye además Redis y PostgreSQL para desarrollo; revisa sus valores antes de utilizarlo en un entorno compartido.

## Seguridad de Meta

Configurar `META_WEBHOOK_APP_SECRET` con el App Secret de Meta y `META_WEBHOOK_SIGNATURE_MODE=enforce` para verificar `X-Hub-Signature-256` en `POST /webhook/meta`. `WA_BUSINESS_TOKEN_WEBHOOK` es el token de verificación usado por Meta en `GET /webhook/meta`; cumple una función distinta. Consulta `env.example` para las demás variables.

## Origen y licencia

Este servidor deriva de Evolution API y conserva código de ese proyecto. Consulta [LICENSE](LICENSE) para los términos de la licencia Apache 2.0 y la atribución correspondiente.
