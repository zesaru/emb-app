# EMB Email System

Sistema profesional de plantillas de email con React Email para la aplicación EMB (Embajada del Perú en Japón).

## 🎯 Características

- ✅ **Diseño profesional** con branding corporativo consistente
- ✅ **Componentes reutilizables** para crear nuevas plantillas rápidamente
- ✅ **Totalmente tipado** con TypeScript
- ✅ **Responsive design** que se ve bien en cualquier cliente de email
- ✅ **Inline styles automático** para máxima compatibilidad
- ✅ **Soporte multiidioma** preparado (actualmente español)

## 📁 Estructura de Directorios

```
components/email/
├── base/                           # Componentes base reutilizables
│   ├── email-layout.tsx           # Layout con header/footer EMB
│   ├── email-button.tsx           # Botones con variantes
│   ├── email-card.tsx             # Contenedores de tarjeta
│   ├── email-badge.tsx            # Badges de estado
│   └── email-text.tsx             # Componentes tipográficos
│
├── templates/                      # Plantillas específicas
│   ├── compensatory/              # Emails de compensatorios
│   │   ├── compensatory-request-admin.tsx
│   │   ├── compensatory-approved-user.tsx
│   │   ├── compensatory-use-request-admin.tsx
│   │   └── compensatory-use-approved-user.tsx
│   │
│   ├── vacation/                  # Emails de vacaciones
│   │   ├── vacation-request-admin.tsx
│   │   └── vacation-approved-user.tsx
│   │
│   └── system/                    # Notificaciones del sistema
│       ├── backup-success.tsx
│       ├── backup-failure.tsx
│       ├── restore-success.tsx
│       └── restore-failure.tsx
│
└── utils/                         # Utilidades
    ├── email-constants.ts         # Colores y estilos globales
    ├── email-types.ts             # Interfaces TypeScript
    ├── email-config.ts            # Configuración (remitente, URLs)
    └── formatters.ts              # Formateo de fechas/horas
```

## 🚀 Uso Básico

### Enviar un Email desde una Action

```typescript
import { CompensatoryRequestAdmin } from '@/components/email/templates/compensatory/compensatory-request-admin';
import { getFromEmail, buildUrl } from '@/components/email/utils/email-config';
import React from "react";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: getFromEmail(),
  to: 'admin@example.com',
  subject: 'Nueva Solicitud de Compensatorio',
  react: React.createElement(CompensatoryRequestAdmin, {
    userName: 'Juan Pérez',
    userEmail: 'juan@example.com',
    eventName: 'Trabajo extra feriado',
    hours: 8,
    eventDate: '2024-01-15',
    approvalUrl: buildUrl('/compensatorios/approvec/123'),
  }),
});
```

## 🎨 Componentes Base

### EmailLayout

Layout principal con header EMB y footer automático.

```tsx
import EmailLayout from '@/components/email/base/email-layout';

<EmailLayout previewText="Texto de previsualización">
  {/* Contenido del email */}
</EmailLayout>
```

### EmailButton

Botón CTA con variantes primary y secondary.

```tsx
import { EmailButton } from '@/components/email/base/email-button';

<EmailButton href="https://example.com" variant="primary">
  Click Aquí
</EmailButton>
```

### EmailCard

Tarjeta para agrupar contenido relacionado.

```tsx
import { EmailCard } from '@/components/email/base/email-card';
import { EmailLabel } from '@/components/email/base/email-text';

<EmailCard>
  <EmailLabel>Nombre</EmailLabel>
  <Text>Juan Pérez</Text>
</EmailCard>
```

### EmailBadge

Badge para mostrar estados (success, warning, error, info).

```tsx
import { EmailBadge } from '@/components/email/base/email-badge';

<EmailBadge variant="success">Aprobado</EmailBadge>
<EmailBadge variant="error">Rechazado</EmailBadge>
```

## 🔧 Utilidades

### Formateo de Fechas

```typescript
import { formatDate, formatDateTime, formatDateRange } from '@/components/email/utils/formatters';

formatDate('2024-01-15') // "15 de enero, 2024"
formatDateTime('2024-01-15T10:30:00Z') // "15 de enero, 2024 14:30"
formatDateRange('2024-01-15', '2024-01-20') // "15 - 20 de enero, 2024"
```

### Formateo de Números

```typescript
import { formatHours, formatDays } from '@/components/email/utils/formatters';

formatHours(1) // "1 hora"
formatHours(5) // "5 horas"
formatDays(3) // "3 días"
```

### Configuración

```typescript
import { getFromEmail, buildUrl } from '@/components/email/utils/email-config';

// Obtiene el remitente configurado (con fallback para testing)
getFromEmail() // "EMB - Embajada del Perú en Japón <noreply@embassyofperuinjapan.org>"

// Construye URLs absolutas
buildUrl('/calendar') // "https://emb-app.vercel.app/calendar"
```

## 🎨 Paleta de Colores

```typescript
colors = {
  primary: '#1c1c1c',           // Negro/gris oscuro
  accentBlue: '#3b82f6',        // Azul del logo
  accentPurple: '#8b5cf6',      // Púrpura del logo
  successGreen: '#d1fae5',      // Fondo éxito
  successText: '#065f46',       // Texto éxito
  errorRed: '#fecaca',          // Fondo error
  errorText: '#991b1b',         // Texto error
  background: '#f6f9fc',        // Fondo página
}
```

## 📝 Plantillas Disponibles

### Compensatorios

1. **CompensatoryRequestAdmin** - Solicitud de registro → Admin
2. **CompensatoryApprovedUser** - Aprobación de registro → Usuario
3. **CompensatoryUseRequestAdmin** - Solicitud de uso → Admin
4. **CompensatoryUseApprovedUser** - Aprobación de uso → Usuario

### Vacaciones

1. **VacationRequestAdmin** - Solicitud de vacaciones → Admin
2. **VacationApprovedUser** - Aprobación de vacaciones → Usuario

### Sistema

1. **BackupSuccess** - Backup completado
2. **BackupFailure** - Backup fallido
3. **RestoreSuccess** - Restauración completada
4. **RestoreFailure** - Restauración fallida

## 🔍 Testing Visual

Para previsualizar las plantillas localmente:

```bash
# Instalar React Email CLI (si no está instalado)
npm install -g react-email

# O usar npx
npx email-dev
```

Esto iniciará un servidor en http://localhost:3001 donde puedes visualizar todas las plantillas.

## 📧 Actions que Envían Emails

| Archivo | Plantilla | Destinatario |
|---------|-----------|--------------|
| `actions/add-compensatorios.ts` | CompensatoryRequestAdmin | Admin |
| `actions/add-vacations.ts` | VacationRequestAdmin | Admin |
| `actions/updateApproveRegister.ts` | CompensatoryApprovedUser | Usuario |
| `actions/updateCompensatorio.ts` | CompensatoryApprovedUser | Usuario |
| `actions/updateVacations.ts` | VacationApprovedUser | Usuario |
| `actions/add-compensatorio-request.ts` | CompensatoryUseRequestAdmin | Admin |
| `actions/updateRegisterHour.ts` | CompensatoryUseApprovedUser | Usuario |
| `lib/backup/email-notifier.ts` | System templates | Admin |

## ⚙️ Configuración de Variables de Entorno

Asegúrate de tener configuradas estas variables en `.env.local`:

```env
RESEND_API_KEY=re_*  # Tu API key de Resend
EMBPERUJAPAN_EMAIL=admin@example.com  # Email del administrador
NEXT_PUBLIC_APP_URL=https://emb-app.vercel.app  # URL base de la app
```

## 🔄 Migración desde el Sistema Antiguo

### Antes (texto plano):

```typescript
await resend.emails.send({
  from: "Team <team@peruinjapan.com>",
  to: email,
  subject: `Solicitud de ${user.email}`,
  text: `El siguiente email ha sido enviado...`,
});
```

### Después (React Email):

```typescript
import { TemplateName } from '@/components/email/templates/...';
import { getFromEmail } from '@/components/email/utils/email-config';
import React from "react";

await resend.emails.send({
  from: getFromEmail(),
  to: email,
  subject: `Nuevo Título Descriptivo`,
  react: React.createElement(TemplateName, {
    // props...
  }),
});
```

## 🛡️ Seguridad

- Todas las plantillas usan inline styles para máxima compatibilidad
- Los emails se construyen del lado del servidor (Server Actions)
- No hay riesgo de XSS ya que el contenido es estático
- Rate limiting en el endpoint de testing (`app/api/send/route.ts`)

## 🚀 Mejoras Futuras

- [ ] Email tracking (opens, clicks) vía Resend
- [ ] Centro de preferencias de notificación para usuarios
- [ ] Emails consolidados (digest diario)
- [ ] Soporte multiidioma (inglés, japonés)
- [ ] Email de bienvenida para nuevos usuarios
- [ ] Recordatorios automáticos para acciones pendientes

## 📚 Recursos

- [React Email Documentation](https://react.email/docs)
- [Resend Documentation](https://resend.com/docs)
- [Email HTML Best Practices](https://www.litmus.com/blog/email-code-practices/)

---

**Mantenido por:** EMB Development Team
**Última actualización:** Febrero 2026
