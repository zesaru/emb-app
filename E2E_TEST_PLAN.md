# E2E Testing Plan - EMB Email System

## 🎯 Objetivo

Validar que el sistema de emails funciona correctamente en todos los flujos de negocio de la aplicación EMB.

---

## 📋 Preparación

### 1. Requisitos Previos

- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Base de datos accesible
- [ ] Cuenta de admin configurada
- [ ] Cuenta de usuario de prueba configurada
- [ ] Acceso a `sistema@embperujapan.org` (o email configurado) para recibir notificaciones

### 2. Usuarios de Prueba

**Admin:**
- Email: (tu email de admin)
- Rol: Admin
- Permisos: Aprobar solicitudes

**Usuario Regular:**
- Email: usuario.prueba@example.com
- Rol: Usuario regular
- Permisos: Crear solicitudes

---

## 🧪 Casos de Prueba

### Test 1: Registro de Compensatorio (Completo)

**Flujo:** Usuario registra horas → Admin recibe email → Admin aprueba → Usuario recibe aprobación

#### Paso 1: Usuario Registra Compensatorio
- [ ] 1.1. Iniciar sesión como usuario regular
- [ ] 1.2. Navegar a `/compensatorios/new`
- [ ] 1.3. Llenar formulario:
  - Nombre del evento: "Trabajo extra feriado prueba"
  - Horas: 8
  - Fecha: (hoy)
- [ ] 1.4. Submit formulario
- [ ] 1.5. Ver confirmación de éxito

#### Paso 2: Admin Recibe Email
- [ ] 2.1. Revisar bandeja de entrada del admin
- [ ] 2.2. Buscar email: "Nueva Solicitud de Compensatorio - {email}"
- [ ] 2.3. Verificar contenido:
  - [ ] Nombre del usuario correcto
  - [ ] Email del usuario correcto
  - [ ] Nombre del evento: "Trabajo extra feriado prueba"
  - [ ] Horas: "8 horas" (en badge azul)
  - [ ] Fecha formateada correctamente
  - [ ] Botón "Revisar y Aprobar Solicitud"
  - [ ] Footer sin línea de "Sistema de Gestión"
- [ ] 2.4. Hacer clic en botón de aprobación
- [ ] 2.5. Verificar que redirige a la página correcta

#### Paso 3: Admin Aprueba Solicitud
- [ ] 3.1. En página de aprobación
- [ ] 3.2. Verificar datos mostrados
- [ ] 3.3. Clic en "Aprobar"
- [ ] 3.4. Ver confirmación de aprobación

#### Paso 4: Usuario Recibe Email de Aprobación
- [ ] 4.1. Revisar bandeja de entrada del usuario
- [ ] 4.2. Buscar email: "¡Tu Solicitud Ha Sido Aprobada!"
- [ ] 4.3. Verificar contenido:
  - [ ] Saludo con nombre del usuario
  - [ ] Evento: "Trabajo extra feriado prueba"
  - [ ] Horas: "+8 horas" (en badge verde)
  - [ ] Estado: "Aprobado"
  - [ ] Total acumulado destacado
  - [ ] Fecha de aprobación
  - [ ] Botón "Ver en Dashboard"
  - [ ] Footer correcto
- [ ] 4.4. Hacer clic en botón "Ver en Dashboard"
- [ ] 4.5. Verificar que redirige al dashboard

**Resultado Esperado:** ✅ Todo el flujo funciona sin errores

---

### Test 2: Uso de Compensatorio (Completo)

**Flujo:** Usuario solicita usar horas → Admin recibe email → Admin aprueba → Usuario recibe aprobación

#### Paso 1: Usuario Solicita Usar Horas
- [ ] 1.1. Iniciar sesión como usuario regular
- [ ] 1.2. Navegar a `/compensatorios/request`
- [ ] 1.3. Llenar formulario:
  - Fecha: (próxima semana)
  - Horas a usar: 4
- [ ] 1.4. Submit formulario
- [ ] 1.5. Ver confirmación de éxito

#### Paso 2: Admin Recibe Email
- [ ] 2.1. Revisar bandeja de entrada del admin
- [ ] 2.2. Buscar email: "Solicitud de Uso de Horas Compensatorias"
- [ ] 2.3. Verificar contenido:
  - [ ] Nombre del usuario
  - [ ] Email del usuario
  - [ ] Fecha solicitada
  - [ ] Horas: "4 horas" (en badge amarillo)
  - [ ] Botón "Revisar y Aprobar Solicitud"
- [ ] 2.4. Hacer clic en botón de aprobación

#### Paso 3: Admin Aprueba Uso
- [ ] 3.1. En página de aprobación
- [ ] 3.2. Clic en "Aprobar"
- [ ] 3.3. Ver confirmación de aprobación

#### Paso 4: Usuario Recibe Email de Aprobación
- [ ] 4.1. Revisar bandeja de entrada del usuario
- [ ] 4.2. Buscar email: "¡Tu Solicitud de Descanso Ha Sido Aprobada!"
- [ ] 4.3. Verificar contenido:
  - [ ] Fecha del descanso
  - [ ] Horas utilizadas: "-4 horas" (en badge verde)
  - [ ] Estado: "Aprobado"
  - [ ] Horas restantes destacado
  - [ ] Botón "Ver en Dashboard"
- [ ] 4.4. Hacer clic en botón

**Resultado Esperado:** ✅ Flujo completo de uso de compensatorios funciona

---

### Test 3: Solicitud de Vacaciones (Completo)

**Flujo:** Usuario solicita vacaciones → Admin recibe email → Admin aprueba → Usuario recibe aprobación

#### Paso 1: Usuario Solicita Vacaciones
- [ ] 1.1. Iniciar sesión como usuario regular
- [ ] 1.2. Navegar a `/vacaciones/new`
- [ ] 1.3. Llenar formulario:
  - Fecha inicio: (próxima semana)
  - Fecha fin: (5 días después)
  - Días: 5
- [ ] 1.4. Submit formulario
- [ ] 1.5. Ver confirmación de éxito

#### Paso 2: Admin Recibe Email
- [ ] 2.1. Revisar bandeja de entrada del admin
- [ ] 2.2. Buscar email: "Nueva Solicitud de Vacaciones - {nombre}"
- [ ] 2.3. Verificar contenido:
  - [ ] Nombre del empleado
  - [ ] Email del empleado
  - [ ] Rango de fechas formateado
  - [ ] Días: "5 días" (en badge azul)
  - [ ] Botón "Aprobar Solicitud de Vacaciones"
- [ ] 2.4. Hacer clic en botón de aprobación

#### Paso 3: Admin Aprueba Vacaciones
- [ ] 3.1. En página de aprobación
- [ ] 3.2. Clic en "Aprobar"
- [ ] 3.3. Ver confirmación de aprobación

#### Paso 4: Usuario Recibe Email de Aprobación
- [ ] 4.1. Revisar bandeja de entrada del usuario
- [ ] 4.2. Buscar email: "¡Tu Solicitud de Vacaciones Ha Sido Aprobada!"
- [ ] 4.3. Verificar contenido:
  - [ ] Período de vacaciones (rango de fechas)
  - [ ] Días aprobados: "5 días" (en badge verde)
  - [ ] Estado: "Aprobado"
  - [ ] Días restantes destacado
  - [ ] Botón "Ver en Calendario"
- [ ] 4.4. Hacer clic en botón

**Resultado Esperado:** ✅ Flujo completo de vacaciones funciona

---

### Test 4: Sistema de Backup (Automatizado)

**Flujo:** Sistema ejecuta backup → Admin recibe notificación

#### Paso 1: Ejecutar Backup Manual
- [ ] 1.1. Acceder a funcionalidad de backup
- [ ] 1.2. Ejecutar backup de prueba
- [ ] 1.3. Esperar completación

#### Paso 2: Admin Recibe Email
- [ ] 2.1. Revisar bandeja de entrada del admin
- [ ] 2.2. Buscar email: "Backup Completado - {filename}"
- [ ] 2.3. Verificar contenido:
  - [ ] Tipo de backup: "Backup completo"
  - [ ] Fecha y hora formateada
  - [ ] Tamaño del archivo
  - [ ] Estado: "Completado" (badge verde)
  - [ ] Sin botones (solo informativo)
  - [ ] Footer correcto

**Resultado Esperado:** ✅ Notificación de backup funciona

---

## 🔍 Verificaciones Adicionales

### Compatibilidad de Email Clients

Probar los emails recibidos en diferentes clientes:

**Web Clients:**
- [ ] Gmail (Chrome/Firefox/Safari)
- [ ] Outlook Web
- [ ] Yahoo Mail

**Desktop Clients:**
- [ ] Outlook (Windows)
- [ ] Apple Mail (macOS)

**Mobile Clients:**
- [ ] Gmail App (iOS/Android)
- [ ] iOS Mail
- [ ] Outlook Mobile

### Responsive Design

- [ ] Probar en viewport móvil (< 480px)
- [ ] Probar en tablet (480px - 768px)
- [ ] Probar en desktop (> 768px)

### Enlaces y Botones

- [ ] Todos los botones son clickeables
- [ ] Los enlaces redirigen a las URLs correctas
- [ ] No hay enlaces rotos
- [ ] Los parámetros en URLs son correctos (IDs, etc.)

### Formato de Contenido

- [ ] Fechas en español: "9 de febrero, 2026"
- [ ] Horas con plural correcto: "8 horas", "1 hora"
- [ ] Días con plural correcto: "5 días", "1 día"
- [ ] Sin caracteres corruptos o encoding issues

---

## 📊 Registro de Resultados

### Test 1: Compensatorio Registro
- Estado: ⬜ Pasó / ❌ Falló
- Observaciones:
- Email timestamps:
- Screenshots:

### Test 2: Compensatorio Uso
- Estado: ⬜ Pasó / ❌ Falló
- Observaciones:
- Email timestamps:
- Screenshots:

### Test 3: Vacaciones
- Estado: ⬜ Pasó / ❌ Falló
- Observaciones:
- Email timestamps:
- Screenshots:

### Test 4: Backup
- Estado: ⬜ Pasó / ❌ Falló
- Observaciones:
- Email timestamps:
- Screenshots:

---

## 🐛 Issues Encontrados

### Issue #1
- **Descripción:**
- **Severidad:** Alta/Media/Baja
- **Pasos para reproducir:**
- **Resultado esperado:**
- **Resultado actual:**

---

## ✅ Checklist Final de Validación

### Funcionalidad
- [ ] Todos los flujos de negocio funcionan
- [ ] Emails llegan a tiempo (dentro de 1 minuto)
- [ ] Contenido de emails es correcto
- [ ] Enlaces funcionan correctamente

### Diseño
- [ ] Branding EMB se ve bien
- [ ] Colores son correctos en todos los emails
- [ ] Layout es responsive en móvil
- [ ] Footer sin línea de "Sistema de Gestión"

### Contenido
- [ ] Todo en español correcto
- [ ] Fechas formateadas adecuadamente
- [ ] Sin typos o errores gramaticales
- [ ] Nombres de usuarios correctos

### Técnico
- [ ] Sin errores en consola del servidor
- [ ] Resend confirma delivery
- [ ] Sin problemas de encoding
- [ ] Performance aceptable (< 3 segundos)

---

## 🎯 Criterios de Éxito

El testing E2E será exitoso si:

1. ✅ **100% de los flujos principales funcionan** (3/3 tests principales)
2. ✅ **90%+ de emails se entregan exitosamente**
3. ✅ **0 errores críticos de funcionalidad**
4. ✅ **Diseño consistente en todos los clientes de email**
5. ✅ **Todos los enlaces y botones funcionan**

---

## 📝 Notas Finales

**Duración estimada:** 2-3 horas
**Personas requeridas:** 2 (1 admin, 1 usuario)
** Herramientas necesarias:**
- Dispositivo con navegador web
- Acceso a cuentas de email
- Servidor de desarrollo local

**Tips:**
- Toma screenshots de cada email
- Registra timestamps de cada email recibido
- Prueba en diferentes dispositivos si es posible
- Documenta cualquier comportamiento inesperado

---

**Preparado por:** EMB Development Team
**Fecha:** Febrero 2026
**Versión:** 1.0
