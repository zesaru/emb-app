# 🚀 E2E Testing - Quick Start Guide

## 📋 Preparación Rápida (5 minutos)

### 1. Iniciar Servidor
```bash
npm run dev
```
✅ Servidor corriendo en http://localhost:3000

### 2. Preparar Emails
- [ ] Abrir `sistema@embperujapan.org` (o tu email de admin)
- [ ] Abrir email de usuario de prueba
- [ ] Asegurarse de que ambos puedan recibir emails

### 3. Usuarios Necesarios
- **Admin:** Tu cuenta con permisos de aprobación
- **Usuario:** Cualquier cuenta regular para crear solicitudes

---

## 🧪 Testing Rápido - Comandos

### Iniciar Tracker
```bash
# Crear/cargar archivo de tracking
npx tsx e2e-test-tracker.ts summary
```

### Test 1: Compensatorio Registro (30 min)

```bash
# Iniciar test
npx tsx e2e-test-tracker.ts start test1 "Compensatorio - Registro"

# PASO 1: Usuario registra
npx tsx e2e-test-tracker.ts observe test1 "Usuario navegó a /compensatorios/new"
npx tsx e2e-test-tracker.ts observe test1 "Usuario llenó formulario: 8 horas, feriado"
npx tsx e2e-test-tracker.ts observe test1 "Usuario submitió formulario exitosamente"

# PASO 2: Admin recibe email
# (cuando llegue el email)
npx tsx e2e-test-tracker.ts email test1 "Admin recibió: Nueva Solicitud de Compensatorio"

# PASO 3: Admin aprueba
npx tsx e2e-test-tracker.ts observe test1 "Admin clic en botón de aprobación"
npx tsx e2e-test-tracker.ts observe test1 "Admin aprobó solicitud en sistema"

# PASO 4: Usuario recibe aprobación
# (cuando llegue el email)
npx tsx e2e-test-tracker.ts email test1 "Usuario recibió: ¡Tu Solicitud Ha Sido Aprobada!"

# Finalizar
npx tsx e2e-test-tracker.ts pass test1
```

### Test 2: Compensatorio Uso (30 min)

```bash
npx tsx e2e-test-tracker.ts start test2 "Compensatorio - Uso"
npx tsx e2e-test-tracker.ts observe test2 "Usuario solicitó usar 4 horas"
npx tsx e2e-test-tracker.ts email test2 "Admin recibió: Solicitud de Uso"
npx tsx e2e-test-tracker.ts observe test2 "Admin aprobó uso de horas"
npx tsx e2e-test-tracker.ts email test2 "Usuario recibió: Descanso Aprobado"
npx tsx e2e-test-tracker.ts pass test2
```

### Test 3: Vacaciones (30 min)

```bash
npx tsx e2e-test-tracker.ts start test3 "Vacaciones - Solicitud"
npx tsx e2e-test-tracker.ts observe test3 "Usuario solicitó 5 días de vacaciones"
npx tsx e2e-test-tracker.ts email test3 "Admin recibió: Nueva Solicitud de Vacaciones"
npx tsx e2e-test-tracker.ts observe test3 "Admin aprobó vacaciones"
npx tsx e2e-test-tracker.ts email test3 "Usuario recibió: Vacaciones Aprobadas"
npx tsx e2e-test-tracker.ts pass test3
```

### Ver Reporte
```bash
# Ver resumen en consola
npx tsx e2e-test-tracker.ts summary

# Generar reporte completo
npx tsx e2e-test-tracker.ts report
```

---

## ✅ Checklist Visual Rápido

Imprime o guarda esta lista para marcar durante el testing:

### Test 1: Compensatorio Registro
- [ ] Usuario: Navega a /compensatorios/new
- [ ] Usuario: Llena formulario (8h)
- [ ] Usuario: Submit ✅
- [ ] Admin: Recibe email ✅
- [ ] Admin: Ve badge azul "8 horas"
- [ ] Admin: Clic en botón "Aprobar"
- [ ] Admin: Aprueba en sistema
- [ ] Usuario: Recibe email ✅
- [ ] Usuario: Ve badge verde "+8 horas"
- [ ] Usuario: Ve total acumulado

### Test 2: Compensatorio Uso
- [ ] Usuario: Navega a /compensatorios/request
- [ ] Usuario: Solicita 4 horas
- [ ] Usuario: Submit ✅
- [ ] Admin: Recibe email ✅
- [ ] Admin: Ve badge amarillo "4 horas"
- [ ] Admin: Aprueba solicitud
- [ ] Usuario: Recibe email ✅
- [ ] Usuario: Ve badge verde "-4 horas"
- [ ] Usuario: Ve horas restantes

### Test 3: Vacaciones
- [ ] Usuario: Navega a /vacaciones/new
- [ ] Usuario: Solicita 5 días
- [ ] Usuario: Submit ✅
- [ ] Admin: Recibe email ✅
- [ ] Admin: Ve badge azul "5 días"
- [ ] Admin: Ve rango de fechas
- [ ] Admin: Aprueba vacaciones
- [ ] Usuario: Recibe email ✅
- [ ] Usuario: Ve badge verde "5 días"
- [ ] Usuario: Ve días restantes

---

## 🐛 Si Algo Falla

### Error: Email no llega
1. Esperar 2-3 minutos
2. Revisar carpeta de spam
3. Verificar logs del servidor
4. Chequear dashboard de Resend

### Error: Botón no funciona
1. Verificar URL en el href
2. Verificar que el servidor esté corriendo
3. Probar URL manualmente en navegador

### Error: Contenido incorrecto
1. Revisar plantilla en `components/email/templates/`
2. Verificar props que se pasan
3. Regenerar templates si necesario

---

## 📊 Criterios de Paso

**El test PASA si:**
- ✅ Ambos emails llegan (admin + usuario)
- ✅ Contenido es correcto en ambos emails
- ✅ Badges muestran colores correctos
- ✅ Botones funcionan y redirigen
- ✅ Fechas están formateadas en español
- [ ] Footer sin "Sistema de Gestión"

**El test FALLA si:**
- ❌ Algún email no llega
- ❌ Contenido incorrecto o corrupto
- ❌ Enlaces rotos
- ❌ Encoding issues (caracteres raros)
- ❌ Timeout (> 3 minutos para recibir email)

---

## 📱 Probar en Móvil (Opcional)

Durante el testing, también abre los emails en tu celular:

1. Revisa mismo email en Gmail app
2. Abre en browser del móvil
3. Verifica que:
   - Botones se ven full-width
   - Texto es legible
   - No hay scroll horizontal

---

## 🎯 Duración Total Estimada

- **Test 1:** 30 minutos
- **Test 2:** 30 minutos
- **Test 3:** 30 minutos
- **Reporte:** 15 minutos

**Total:** ~2 horas

---

## 💡 Tips

1. **Screenshots:** Toma captura de cada email recibido
2. **Timestamps:** Anota la hora de cada email
3. **Dos dispositivos:** Usa una computadora para admin y celular para usuario
4. **Quick actions:** Prepara bookmarks a las páginas de aprobación
5. **Café:** ☕ Necesitarás energía para 2 horas de testing

---

## 📝 Archivos Generados

Al terminar tendrás:
- `e2e-test-results.json` - Datos crudos
- `E2E_TEST_REPORT.md` - Reporte formateado
- Screenshots de emails
- Lista de issues encontrados (si hay)

---

**¿Listo para empezar?** 🚀

Empieza con: `npx tsx e2e-test-tracker.ts start test1 "Compensatorio - Registro"`
