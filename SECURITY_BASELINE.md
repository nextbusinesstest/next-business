# Next Business — Security Baseline (MVP)

Esta guía define lo **no negociable** para el pilar 1 (generación automática de webs) y sienta base para escalar.

## API (pages/api)

### 1) Validación de entrada (obligatorio)
- Validar y **sanitizar** todos los campos de entrada.
- Limitar longitudes de strings.
- Limitar número de elementos en listas.
- Rechazar payloads demasiado grandes (p. ej. DataURL de logos).

### 2) Rate limiting (obligatorio)
- Limitar peticiones por IP en endpoints críticos.
- Devolver `429` con headers `X-RateLimit-*`.
- En producción: migrar a store persistente (Redis/Upstash) para evitar resets.

### 3) Errores (obligatorio)
- No filtrar stack traces al cliente.
- Mensajes de error genéricos para `500`.

## Frontend

### 4) XSS
- Evitar `dangerouslySetInnerHTML`.
- Renderizar texto como texto (React escapa por defecto).

### 5) Datos sensibles
- No guardar información sensible en `localStorage`.
- El `site_spec` es aceptable mientras no contenga secretos.

## Seguridad de cabeceras HTTP

### 6) Headers de seguridad
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictiva
- `CSP` como baseline (revisar a futuro para nonces si queremos eliminar `unsafe-inline/eval`).

## Dependencias

### 7) Auditoría
- Activar Dependabot.
- Ejecutar `npm audit` periódicamente.
- Evitar dependencias no mantenidas.

## Roadmap de hardening
- CSP con nonces (quitar `unsafe-inline/eval`).
- Rate limiting persistente.
- Logging estructurado + alertas.
- WAF (Cloudflare) y bot protection.
