# E2E Scenario Architect

Generador de pruebas end-to-end con Playwright para simular flujos completos de usuario en la aplicación EMB.

## Comandos

### generate <scenario>
Genera una prueba E2E para el escenario especificado.

```
generar e2e para flujo de login
generar e2e para aprobación de vacaciones
generar e2e para registro de asistencia
generar e2e para solicitud de compensatorio
```

### run
Ejecuta todas las pruebas E2E.

```bash
pnpm run test:e2e
```

### run:ui
Ejecuta pruebas con interfaz visual de Playwright.

```bash
pnpm run test:e2e:ui
```

### run:debug
Ejecuta pruebas en modo debug con inspector.

```bash
npx playwright test --debug
```

## Escenarios disponibles

### Autenticación
- Login exitoso con credenciales válidas
- Login fallido con credenciales inválidas
- Logout y redirección a /login
- Protected routes redirigen a login

### Vacaciones
- Solicitud de vacaciones por usuario
- Aprobación de vacaciones por admin
- Rechazo de vacaciones por admin
- Validación de fechas

### Compensatorios
- Registro de horas trabajadas
- Solicitud de tiempo libre
- Aprobación de solicitud por admin
- Validación de horas disponibles

### Asistencia
- Registro de entrada/salida
- Modificación de registro por admin
- Vista de calendario de asistencias

## Estructura de archivos

```
e2e/
├── fixtures/
│   ├── admin-auth.ts    # Credenciales de admin
│   └── user-auth.ts     # Credenciales de usuario regular
├── scenarios/
│   ├── auth.spec.ts
│   ├── vacations.spec.ts
│   ├── compensatory.spec.ts
│   └── attendance.spec.ts
└── playwright.config.ts
```

## Configuración Playwright

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/scenarios',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```
