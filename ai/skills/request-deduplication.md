# Request Deduplication

## Objetivo

Evitar múltiples requests idénticas.

## Reglas

- Si una request igual está en curso → no crear otra
- Cancelar requests duplicadas
- Reutilizar respuesta existente

## Aplicación

Frontend + API layer
