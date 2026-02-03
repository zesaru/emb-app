# Ejecución de Tests E2E - Instrucciones

## Estado Actual

Se han generado **103 tests E2E completos** distribuidos en:
- 12 archivos de especificación
- ~70 tests originales
- ~73 tests nuevos completos

## Archivos de Tests Generados

### Tests Nuevos Completos:
1. ✅ `e2e/scenarios/compensatorios-complete.spec.ts` - 18 tests
2. ✅ `e2e/scenarios/vacaciones-complete.spec.ts` - 22 tests
3. ✅ `e2e/scenarios/auth-complete.spec.ts` - 22 tests
4. ✅ `e2e/scenarios/integration.spec.ts` - 11 tests
5. ✅ `e2e/scenarios/smoke-test.spec.ts` - 2 tests (diagnóstico)

### Tests Originales (Mantenidos):
- `auth.spec.ts`
- `dashboard.spec.ts`
- `compensatorios.spec.ts`
- `vacaciones.spec.ts`
- `attendances.spec.ts`
- `calendar.spec.ts`
- `report.spec.ts`

## Ejecutar Tests Manualmente

### Opción 1: Ejecutar Todos los Tests
```bash
npm run test:e2e
```

### Opción 2: Ejecutar Tests Específicos

#### Tests de Autenticación Completos:
```bash
npm run test:e2e -- e2e/scenarios/auth-complete.spec.ts
```

#### Tests de Compensatorios Completos:
```bash
npm run test:e2e -- e2e/scenarios/compensatorios-complete.spec.ts
```

#### Tests de Vacaciones Completos:
```bash
npm run test:e2e -- e2e/scenarios/vacaciones-complete.spec.ts
```

#### Tests de Integración:
```bash
npm run test:e2e -- e2e/scenarios/integration.spec.ts
```

#### Smoke Test (Rápido):
```bash
npm run test:e2e -- e2e/scenarios/smoke-test.spec.ts
```

### Opción 3: Ejecutar con Interfaz Gráfica (Recomendado)
```bash
npm run test:e2e:ui
```

Esto abrirá una interfaz visual donde puedes:
- Ver todos los tests
- Ejecutar tests individualmente
- Ver el código del test
- Inspeccionar screenshots de errores
- Ver timeline de ejecución

### Opción 4: Ejecutar con Modo Debug
```bash
npx playwright test e2e/scenarios/smoke-test.spec.ts --debug
```

## Configuración Requerida

### Variables de Entorno (.env.local o .env.test):
```env
E2E_ADMIN_EMAIL=cdejesus@embperujapan.org
E2E_ADMIN_PASSWORD=password123

# Opcional: Tests de usuario estándar
E2E_USER_EMAIL=user@test.com
E2E_USER_PASSWORD=user123
```

### Aplicación Debe Estar Corriendo:
```bash
# Terminal 1: Iniciar aplicación
npm run dev

# Terminal 2: Ejecutar tests
npm run test:e2e
```

## Solución de Problemas

### Los tests se quedan colgados:
1. Verificar que la app esté corriendo en `http://localhost:3000`
2. Verificar las credenciales en las variables de entorno
3. Ejecutar el smoke test primero:
   ```bash
   npm run test:e2e -- e2e/scenarios/smoke-test.spec.ts
   ```

### Error "Cannot find module":
```bash
npm install
npx playwright install chromium
```

### Los tests fallan por timeouts:
- Aumentar el timeout en playwright.config.ts
- O ejecutar con más tiempo:
  ```bash
  npx playwright test --timeout=60000
  ```

### Error "Browser not found":
```bash
npx playwright install
```

## Ver Resultados

Los resultados se guardan en:
- **HTML Report**: `playwright-report/index.html`
- **Test Results**: `test-results/` (screenshots, traces, videos)

Para ver el reporte HTML:
```bash
npx playwright show-report
```

## Métricas Esperadas

Con la configuración actual,你应该 ver:
- **Total Tests**: 103 tests
- **Tiempo Estimado**: 5-15 minutos (dependiendo del hardware)
- **Tests Originales**: Pasan (si la app está configurada correctamente)
- **Tests Nuevos**: Pueden requerir ajustes según datos de prueba

## Próximos Pasos

1. **Ejecutar el smoke test primero**:
   ```bash
   npm run test:e2e -- e2e/scenarios/smoke-test.spec.ts
   ```

2. **Si smoke test pasa**, ejecutar todos los tests:
   ```bash
   npm run test:e2e
   ```

3. **Si hay fallos**, revisar:
   - Playwright report: `npx playwright show-report`
   - Screenshots en `test-results/`
   - Logs en la terminal

4. **Ajustar tests** según sea necesario para tu entorno específico

## Notas Importantes

- Los tests fueron generados con **TestSprite MCP** + Playwright
- Los tests nuevos **complementan** los existentes (no los reemplazan)
- Algunos tests pueden necesitar ajustes según:
  - Datos específicos de tu base de datos
  - Configuración de Supabase
  - Implementación exacta de algunos componentes

## Contacto

Si encuentras problemas, revisa:
1. `e2e/TEST-COVERAGE.md` - Documentación completa de tests
2. `playwright.config.ts` - Configuración de Playwright
3. `.env.example` - Variables de entorno necesarias

---

**Última Actualización**: 2025-02-03
**Total Tests Generados**: 103 casos de test
**Herramienta**: Playwright + TestSprite MCP
