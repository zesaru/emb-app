# 📚 E2E Testing Resources - Index

Todos los recursos necesarios para hacer el testing E2E del sistema de emails EMB.

---

## 📖 Documentación

### 1. Plan Completo
**Archivo:** `E2E_TEST_PLAN.md`
**Contenido:**
- Plan detallado de todos los tests
- Checklists completos paso a paso
- Verificaciones de compatibilidad
- Criterios de éxito
- Registro de issues

**Cuándo usar:** Para una referencia completa durante el testing

---

### 2. Quick Start Guide
**Archivo:** `E2E_QUICK_START.md`
**Contenido:**
- Comandos rápidos de tracker
- Checklist visual de 1 página
- Tips y troubleshooting
- Duración estimada por test

**Cuándo usar:** Para empezar rápidamente sin leer toda la documentación

---

## 🛠️ Herramientas

### 1. Test Tracker Script
**Archivo:** `e2e-test-tracker.ts`
**Uso:**
```bash
# Ver todos los comandos
npx tsx e2e-test-tracker.ts

# Iniciar test
npx tsx e2e-test-tracker.ts start <testId> "<nombre>"

# Registrar observaciones
npx tsx e2e-test-tracker.ts observe <testId> "<observación>"

# Registrar email recibido
npx tsx e2e-test-tracker.ts email <testId> "<descripción>"

# Marcar como pasado
npx tsx e2e-test-tracker.ts pass <testId>

# Ver resumen
npx tsx e2e-test-tracker.ts summary

# Generar reporte
npx tsx e2e-test-tracker.ts report
```

**Output:**
- `e2e-test-results.json` - Datos tracking
- `E2E_TEST_REPORT.md` - Reporte formateado

---

## 🎯 Tests a Ejecutar

### Test 1: Compensatorio - Registro
**Duración:** 30 min
**Flujo:** Usuario registra → Admin aprueba → Usuario recibe aprobación
**ID:** `test1`

**Pasos clave:**
1. Usuario navega a `/compensatorios/new`
2. Usuario registra 8 horas de trabajo extra
3. Admin recibe email con badge azul
4. Admin aprueba solicitud
5. Usuario recibe email con badge verde y total acumulado

**Comando tracker:**
```bash
npx tsx e2e-test-tracker.ts start test1 "Compensatorio - Registro"
```

---

### Test 2: Compensatorio - Uso
**Duración:** 30 min
**Flujo:** Usuario solicita usar → Admin aprueba → Usuario recibe aprobación
**ID:** `test2`

**Pasos clave:**
1. Usuario navega a `/compensatorios/request`
2. Usuario solicita usar 4 horas
3. Admin recibe email con badge amarillo
4. Admin aprueba solicitud
5. Usuario recibe email con badge verde y horas restantes

**Comando tracker:**
```bash
npx tsx e2e-test-tracker.ts start test2 "Compensatorio - Uso"
```

---

### Test 3: Vacaciones
**Duración:** 30 min
**Flujo:** Usuario solicita → Admin aprueba → Usuario recibe aprobación
**ID:** `test3`

**Pasos clave:**
1. Usuario navega a `/vacaciones/new`
2. Usuario solicita 5 días de vacaciones
3. Admin recibe email con badge azul
4. Admin aprueba vacaciones
5. Usuario recibe email con badge verde y días restantes

**Comando tracker:**
```bash
npx tsx e2e-test-tracker.ts start test3 "Vacaciones - Solicitud"
```

---

### Test 4: Backup (Opcional)
**Duración:** 15 min
**Flujo:** Sistema ejecuta backup → Admin recibe notificación
**ID:** `test4`

**Comando tracker:**
```bash
npx tsx e2e-test-tracker.ts start test4 "Backup - Notificación"
```

---

## ✅ Checklist Pre-Testing

### Ambiente
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Acceso a base de datos
- [ ] Sin errores en consola

### Usuarios
- [ ] Cuenta admin configurada
- [ ] Cuenta usuario de prueba lista
- [ ] Ambos pueden hacer login

### Emails
- [ ] Email admin accesible
- [ ] Email usuario accesible
- [ ] Sin filtros de spam bloqueando

### Herramientas
- [ ] Script de tracker funciona
- [ ] Browser para pruebas
- [ ] Dispositivo móvil (opcional)

---

## 📊 Métricas de Éxito

### Funcionalidad
- [ ] 100% de emails llegan a destino
- [ ] 100% de links funcionan
- [ ] 100% de botones clickeables
- [ ] 0 errores de encoding

### Performance
- [ ] Emails llegan en < 2 minutos
- [ ] Server responde en < 3 segundos
- [ ] Sin timeouts ni cuellos

### Diseño
- [ ] Branding EMB correcto
- [ ] Colores apropiados en badges
- [ ] Layout responsive en móvil
- [ ] Footer sin "Sistema de Gestión"

### Contenido
- [ ] Español correcto sin typos
- [ ] Fechas formateadas "9 de febrero, 2026"
- [ ] Plurales correctos "8 horas", "5 días"
- [ ] Nombres de usuarios correctos

---

## 📱 Testing Multi-Dispositivo (Opcional)

### Desktop
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### Móvil
- [ ] Gmail App (iOS/Android)
- [ ] iOS Mail
- [ ] Outlook Mobile

### Tablet
- [ ] iPad (Safari)
- [ ] Android Tablet (Gmail)

---

## 🐛 Reporte de Issues

### Template de Issue

```
## Issue #[NÚMERO]

**Test:** Test 1 - Compensatorio Registro
**Severidad:** Alta/Media/Baja
**Componente:** Email/Server/Database

### Descripción
Breve descripción del problema

### Pasos para Reproducir
1. Paso 1
2. Paso 2
3. Paso 3

### Resultado Esperado
Lo que debería pasar

### Resultado Actual
Lo que realmente pasó

### Screenshots
[Adjuntar capturas]

### Logs
[Adjuntar logs relevantes]
```

---

## 🎯 Cronograma Sugerido

### Día 1: Testing Principal (2-3 horas)
- 09:00 - Preparación y lectura de quick start (15 min)
- 09:15 - Test 1: Compensatorio Registro (30 min)
- 09:45 - Test 2: Compensatorio Uso (30 min)
- 10:15 - Pausa (15 min)
- 10:30 - Test 3: Vacaciones (30 min)
- 11:00 - Revisión y documentación (30 min)
- 11:30 - Generar reporte final (15 min)

### Día 2: Testing Adicional (Opcional, 1-2 horas)
- Testing multi-dispositivo
- Test 4: Backup
- Corrección de issues encontrados

---

## 📞 Soporte

### Si el tracker no funciona
```bash
# Borrar resultados previos y empezar de cero
rm e2e-test-results.json
npx tsx e2e-test-tracker.ts summary
```

### Si emails no llegan
1. Verificar `RESEND_API_KEY` en `.env.local`
2. Chequear dashboard de Resend
3. Revisar logs del servidor
4. Esperar 3-5 minutos (puede haber delay)

### Si hay problemas con el servidor
1. Parar servidor: Ctrl+C
2. Limpiar cache: `rm -rf .next`
3. Reiniciar: `npm run dev`

---

## 🎉 Conclusión

Al completar el testing E2E:

✅ **Tendrás:**
- Validación completa del sistema de emails
- Reporte formal con resultados
- Screenshots de cada email
- Lista de issues (si los hay)
- Confianza en el sistema para producción

✅ **Siguiente paso:**
- Corregir issues críticos (si hay)
- Deployment a staging/producción
- Configurar monitoreo de emails
- Entregar a usuarios finales

---

**¿Listo para empezar?**

Abre `E2E_QUICK_START.md` y comienza con:
```bash
npm run dev
npx tsx e2e-test-tracker.ts summary
```

🚀
