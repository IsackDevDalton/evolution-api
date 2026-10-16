# Seguridad de Wappi Gateway

Reporta vulnerabilidades por el canal interno de seguridad de Novacti, indicando el componente afectado, cómo reproducir el problema y su impacto. Evita incluir llaves, tokens o datos personales en tickets públicos.

La API requiere autenticación para sus rutas administrativas. Para los webhooks entrantes de Meta, configura `META_WEBHOOK_SIGNATURE_MODE=enforce` y `META_WEBHOOK_APP_SECRET`. Los webhooks salientes hacia Azure deben usar los mecanismos de autenticación del destino. Revisa los cambios de seguridad antes de desplegar en un entorno compartido.

El código original está sujeto a [LICENSE](LICENSE).
