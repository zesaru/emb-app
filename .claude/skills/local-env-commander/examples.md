# Local Env Commander - Ejemplos

## Ejemplo 1: Verificar estado antes de trabajar

```
Usuario: Verifica si el entorno está listo
Claude:
- Ejecutando `npx supabase status`
- Ejecutando `lsof -i :3000`

Resultados:
✓ Supabase: RUNNING (API: 54321, DB: 54322, Studio: 54323)
✓ Next.js: RUNNING (PID 12345)
✓ Docker: 3 contenedores activos

Entorno listo para desarrollo.
```

## Ejemplo 2: Iniciar entorno desde cero

```
Usuario: Inicia el entorno local
Claude:
- Ejecutando `npx supabase start`

[Supabase] Applying migrations...
[Supabase] Started supabase local development setup.

¡Entorno iniciado! URL API: http://localhost:54321
```

## Ejemplo 3: Resetear base de datos

```
Usuario: Resetea la base de datos local
Claude:
⚠️  Esto eliminará todos los datos locales de Supabase.
¿Continuar? [s/N]

Usuario: s

Claude: Ejecutando `npx supabase db reset`
[Supabase] Resetting database...
✓ Base de datos reseteada con migraciones aplicadas.
```
