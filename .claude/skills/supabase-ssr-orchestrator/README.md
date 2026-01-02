# Supabase SSR Orchestrator - Skill

Skill de Claude Code para garantizar el uso correcto de Supabase SSR en el proyecto EMB.

## Estructura

```
supabase-ssr-orchestrator/
├── skill.md          # Archivo principal (se carga automáticamente)
├── examples.md       # Ejemplos de uso para cada contexto
├── types/
│   └── database.type.ts  # Tipos de la base de datos
└── README.md         # Este archivo
```

## Cómo Funciona

Cuando Claude detecte que estás trabajando con Supabase en este proyecto:

1. **Detectará el contexto** - Leerá el archivo para ver si tiene `'use client'` o no
2. **Sugerirá el import correcto**:
   - Server Component/Action → `@/utils/supabase/server`
   - Client Component → `@/utils/supabase/client`
   - Middleware → `@/utils/supabase/middleware`
3. **Conocerá el esquema** - Podrá autocompletar nombres de tablas, columnas y funciones RPC
4. **Alertará sobre errores** - Te avisará si estás mezclando clientes incorrectamente

## Prevención de Errores

| Error | Causa | Prevención |
|-------|-------|------------|
| Hydration failed | Server client en Client Component | Linter de importación |
| Cookies not available | Browser client en Server Component | Linter de importación |
| Session expired | Sin updateSession en middleware | Alerta de middleware |
| Type errors | Consultas sin tipar | Referencia a Database types |

## Uso

La skill se activa automáticamente cuando trabajas con archivos que importan de Supabase. No requiere configuración adicional.

Para referenciarla explícitamente:

```bash
# Claude detectará automáticamente cuando trabajes con:
# - utils/supabase/*
# - actions/*
# - app/* routes
```

## Actualización

Cuando se agreguen nuevas tablas o funciones RPC a la base de datos:

1. Regenerar tipos: `npm run gen-types`
2. Actualizar: `cp types/database.type.ts .claude/skills/supabase-ssr-orchestrator/types/`
3. Actualizar `skill.md` con nuevas funciones RPC si es necesario
