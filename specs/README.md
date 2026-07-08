# Nexus — Especificación del Sistema (Fase 1)

Sistema personal unificado que fusiona el control de backlog de videojuegos con un monitor inteligente de ofertas. Desarrollado bajo **Spec-Driven Development**.

- **Manager** — backlog multiplataforma (Steam / Switch 2 / Xbox) con estados y foco en el valor real del juego.
- **Hunter** — monitor de precios y ofertas en Steam, Nintendo eShop (Switch 2) y Xbox Store.

## Decisiones fundacionales (Fase 1)

| Decisión | Valor |
|---|---|
| Modelo de usuarios | Multi-usuario con login (JWT) |
| Forma de entrega | App de escritorio (Tauri) con backend embebido (sidecar), portable a self-hosting |
| Fuente de precios | IsThereAnyDeal (Steam + eShop + Xbox) + Steam Store API (precio AR exacto) |
| Región / moneda | Argentina / ARS |
| Base | Evolución de `Game-manager`; se absorbe la técnica Steam-Store de `game-hunter` |

## Documentos

1. [System Architecture & Tech Stack](01-architecture.md)
2. [API Specification (OpenAPI 3.1)](02-api-spec.md)
3. [Database Schema](03-database-schema.md)
4. [Product Requirement Document (MVP)](04-prd-mvp.md)

## Estado

`DRAFT v0.1` — Borrador inicial para iterar. Pendiente: validación de cobertura ITAD para eShop/Xbox en región AR (spike de Fase 2).
