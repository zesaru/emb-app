import { z } from 'zod';

/**
 * Esquemas de validación Zod para la aplicación
 * Usar estos schemas para validar datos de entrada en Server Actions
 */

// ============================================================================
// VALIDADORES COMUNES
// ============================================================================

export const uuidSchema = z.string().uuid('ID UUID inválido');

export const emailSchema = z.string().email('Email inválido');

export const positiveIntegerSchema = z.number()
  .int('Debe ser un número entero')
  .positive('Debe ser mayor a 0');

export const nonNegativeIntegerSchema = z.number()
  .int('Debe ser un número entero')
  .min(0, 'Debe ser mayor o igual a 0');

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (debe ser YYYY-MM-DD)');

export const timeSchema = z.string()
  .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (debe ser HH:MM)');

// ============================================================================
// VACACIONES
// ============================================================================

export const vacationSchema = z.object({
  userId: uuidSchema.optional(),
  start: z.coerce.date({
    required_error: 'Fecha de inicio es requerida',
    invalid_type_error: 'Fecha de inicio inválida',
  }),
  finish: z.coerce.date({
    required_error: 'Fecha de fin es requerida',
    invalid_type_error: 'Fecha de fin inválida',
  }),
  days: positiveIntegerSchema.max(30, 'Máximo 30 días de vacaciones'),
});

export const vacationUpdateSchema = z.object({
  id: uuidSchema,
  approveRequest: z.boolean().optional(),
  approvedBy: uuidSchema.optional(),
  approvedDate: z.string().optional(),
  finalApproveRequest: z.boolean().optional(),
});

// ============================================================================
// COMPENSATORIOS
// ============================================================================

export const compensatorySchema = z.object({
  userId: uuidSchema.optional(),
  eventName: z.string().min(1, 'Nombre del evento es requerido').max(200, 'Máximo 200 caracteres'),
  eventDate: z.string().min(1, 'Fecha del evento es requerida'),
  hours: positiveIntegerSchema.max(12, 'Máximo 12 horas por día'),
  tTimeStart: timeSchema.optional(),
  tTimeFinish: timeSchema.optional(),
});

// Schema para solicitud de compensatorio (request)
export const compensatoryRequestSchema = z.object({
  dob: z.coerce.date({
    required_error: 'Fecha es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  time_start: timeSchema,
  time_finish: timeSchema,
  hours: z.coerce.number()
    .int('Debe ser un número entero')
    .positive('Debe ser mayor a 0')
    .max(12, 'Máximo 12 horas por día'),
}).superRefine((data, ctx) => {
  const [startHour, startMinute] = data.time_start.split(':').map(Number);
  const [finishHour, finishMinute] = data.time_finish.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const finishTotalMinutes = finishHour * 60 + finishMinute;

  if (finishTotalMinutes <= startTotalMinutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['time_finish'],
      message: 'La hora de fin debe ser posterior a la hora de inicio',
    });
    return;
  }

  const durationMinutes = finishTotalMinutes - startTotalMinutes;
  const requestedMinutes = data.hours * 60;

  if (requestedMinutes > durationMinutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hours'],
      message: 'Las horas solicitadas exceden el rango horario seleccionado',
    });
  }
});

export const compensatoryUpdateSchema = z.object({
  id: uuidSchema,
  approveRequest: z.boolean().optional(),
  approvedBy: uuidSchema.optional(),
  approvedDate: z.string().optional(),
  compensatedHours: nonNegativeIntegerSchema.max(12, 'Máximo 12 horas compensadas'),
  compensatedHoursDay: z.string().optional(),
  approvedByCompensated: uuidSchema.optional(),
  finalApproveRequest: z.boolean().optional(),
});

// Schema para aprobación de registro de horas compensatorias
export const compensatoryRegisterApprovalSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  email: emailSchema,
  compensated_hours: positiveIntegerSchema.max(12, 'Máximo 12 horas'),
});

// ============================================================================
// ASISTENCIAS (ATTENDANCES)
// ============================================================================

export const attendanceSchema = z.object({
  userId: uuidSchema.optional(),
  date: dateSchema,
  register: z.number().int().min(0).max(2, 'Register debe ser 0, 1 o 2'),
  ai: z.number().int().min(0).max(1, 'AI debe ser 0 o 1').optional(),
});

export const attendanceUpdateSchema = z.object({
  id: z.number().int().positive(),
  register: z.number().int().min(0).max(2, 'Register debe ser 0, 1 o 2'),
  ai: z.number().int().min(0).max(1, 'AI debe ser 0 o 1').optional(),
});

// ============================================================================
// USUARIOS
// ============================================================================

export const userUpdateSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Nombre es requerido').max(100, 'Máximo 100 caracteres').optional(),
  email: emailSchema.optional(),
  role: z.string().optional(),
  numVacations: nonNegativeIntegerSchema.optional(),
  numCompensatorys: nonNegativeIntegerSchema.optional(),
  isActive: z.boolean().optional(),
});

export const passwordUpdateSchema = z.object({
  password: z.string()
    .min(6, 'Contraseña debe tener al menos 6 caracteres')
    .max(100, 'Máximo 100 caracteres'),
});

export const adminRoleSchema = z.enum(["admin", "user"]);

export const adminUserProvisioningModeSchema = z.enum(["invite", "temporary_password"]);

export const adminUserCreateSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, "Nombre es requerido").max(100, "Máximo 100 caracteres"),
  role: adminRoleSchema.default("user"),
  provisioningMode: adminUserProvisioningModeSchema,
  temporaryPassword: z.string().min(8, "Contraseña temporal debe tener al menos 8 caracteres").max(100).optional(),
  numVacations: nonNegativeIntegerSchema.optional().default(0),
  numCompensatorys: nonNegativeIntegerSchema.optional().default(0),
}).superRefine((data, ctx) => {
  if (data.provisioningMode === "temporary_password" && !data.temporaryPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["temporaryPassword"],
      message: "Contraseña temporal es requerida para este modo",
    });
  }
});

export const adminUserUpdateSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Nombre es requerido').max(100, 'Máximo 100 caracteres').optional(),
  role: adminRoleSchema.optional(),
  numVacations: nonNegativeIntegerSchema.optional(),
  numCompensatorys: nonNegativeIntegerSchema.optional(),
});

export const adminUserStatusSchema = z.object({
  userId: uuidSchema,
});

export const adminUserPasswordResetLinkSchema = z.object({
  userId: uuidSchema,
});

export const adminUserSetTemporaryPasswordSchema = z.object({
  userId: uuidSchema,
  password: z.string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres')
    .max(100, 'Máximo 100 caracteres'),
});

export const adminUserListFiltersSchema = z.object({
  search: z.string().max(120).optional(),
  status: z.enum(["all", "active", "inactive"]).optional().default("all"),
  role: z.enum(["all", "admin", "user"]).optional().default("all"),
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valida datos contra un schema y retorna los datos validados o lanza error
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Valida datos de forma segura (retorna error en lugar de lanzar)
 */
export function safeValidateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  };
}
