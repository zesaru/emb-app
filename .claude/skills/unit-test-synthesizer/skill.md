# Unit Test Synthesizer

Generador de pruebas unitarias para componentes React y funciones de lógica de negocio usando Vitest y React Testing Library.

## Comandos

### generate <ruta>
Genera pruebas unitarias para el archivo/componente especificado.

```
generar test para components/ui/button.tsx
generar test para actions/getUsers.ts
generar test para lib/validation/schemas.ts
```

### run
Ejecuta todas las pruebas unitarias en modo watch.

```bash
pnpm run test
```

### run:ui
Ejecuta pruebas con interfaz gráfica.

```bash
pnpm run test:ui
```

### coverage
Genera reporte de cobertura de pruebas.

```bash
pnpm run test:coverage
```

## Patrones de prueba

### Componentes React
- Usar `render` de @testing-library/react
- Usar `screen` para consultar elementos
- Probar props, interacciones y estados
- Mockear hooks externos (zustand, supabase)

### Server Actions
- Mockear `createClient()` de Supabase
- Probar manejo de errores
- Probar validación de datos con Zod

### Utilidades
- Probar casos edge (null, undefined, valores límite)
- Probar tipos de retorno
- Probar efectos secundarios

## Estructura de archivos de prueba

```
test/
├── setup.ts           # Configuración global de Vitest
├── mocks/
│   ├── supabase.ts    # Mock de Supabase
│   └── zustand.ts     # Mock de Zustand store
├── unit/
│   ├── components/
│   ├── actions/
│   └── lib/
```
