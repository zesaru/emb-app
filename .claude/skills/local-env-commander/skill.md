# Local Env Commander

Orquestador del entorno de desarrollo local para EMB. Gestiona Supabase local, servidor Next.js y contenedores Docker.

## Comandos

### status
Verificar el estado de todos los servicios del entorno local.

```bash
npx supabase status
lsof -i :3000 || echo "Next.js no está corriendo"
docker ps
```

### start
Iniciar todos los servicios del entorno local.

```bash
npx supabase start
npm run dev
```

### stop
Detener todos los servicios del entorno local.

```bash
npx supabase stop
# Matar proceso en puerto 3000 si existe
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
```

### reset
Resetear la base de datos local de Supabase (perderás datos locales).

```bash
npx supabase db reset
```

### logs
Mostrar logs de Supabase local.

```bash
npx supabase logs
```

## Patrones detectados

- Supabase local usa Docker internamente
- Next.js corre en puerto 3000 por defecto
- `npx supabase start` inicializa: Postgres (54322), API (54321), Studio (54323)

## Dependencias

- Supabase CLI instalada globalmente o vía npx
- Docker corriendo
- Node.js y pnpm disponibles
