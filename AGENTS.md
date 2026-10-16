# Wappi Gateway: instrucciones para agentes

Este repositorio contiene el servidor de mensajería de Wappi, producto de Novacti. El código deriva de Evolution API; conserva la licencia y atribución en `LICENSE`.

## Alcance activo

- Meta Cloud API y su webhook entrante.
- Rutas de instancias, mensajes y webhook HTTP saliente.
- PostgreSQL, Redis y almacenamiento necesario para medios.

El Manager, Chatwoot, bots y los conectores de eventos distintos del webhook HTTP se están retirando. No reactivar rutas o servicios heredados sin una necesidad explícita y verificada del proyecto.

## Trabajo en el código

- Antes de retirar un módulo, comprobar sus importaciones, rutas, llamadas y dependencias de despliegue.
- Preservar contratos de Meta, Wappi y Azure, especialmente la verificación de firma y la entrega de mensajes.
- No registrar secretos ni cuerpos completos de mensajes.
- Ejecutar `npm run build` cuando estén instaladas las dependencias; si no es posible, indicar la limitación.
- Mantener `README.md`, `SECURITY.md`, `env.example` y los Compose alineados con el código activo.
