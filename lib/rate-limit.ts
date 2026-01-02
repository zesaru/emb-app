/**
 * Rate Limiting básico en memoria
 * Útil para prevenir ataques de fuerza bruta en endpoints sensibles
 *
 * Nota: Este almacenamiento en memoria se resetea al reiniciar el servidor.
 * Para producción con múltiples instancias, considerar usar Redis o Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Almacenamiento en memoria
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas (cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Máximo número de solicitudes permitidas */
  limit: number;
  /** Ventana de tiempo en milisegundos */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining?: number;
  resetTime?: number;
}

/**
 * Verifica si una identificación (IP, userId, etc.) ha excedido el límite
 *
 * @param identifier - Identificador único (IP, userId, etc.)
 * @param options - Opciones de rate limiting
 * @returns Resultado con éxito yRemaining solicitudes
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 5, windowMs: 15 * 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Si no hay entrada o expiró, crear nueva
  if (!entry || entry.resetTime < now) {
    const resetTime = now + options.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      resetTime,
    };
  }

  // Si existe y no ha expirado, incrementar contador
  if (entry.count >= options.limit) {
    return {
      success: false,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: options.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Resetea el contador para una identificación específica
 * Útil después de un login exitoso
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Obtiene información del rate limit para una identificación
 */
export function getRateLimitInfo(identifier: string): {
  count: number;
  remaining: number;
  resetTime: number;
} | null {
  const entry = rateLimitStore.get(identifier);
  if (!entry || entry.resetTime < Date.now()) {
    return null;
  }
  return {
    count: entry.count,
    remaining: Math.max(0, 5 - entry.count), // Default limit of 5
    resetTime: entry.resetTime,
  };
}

// ============================================================================
// PRECONFIGURACIONES COMUNES
// ============================================================================

export const loginRateLimit = {
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
};

export const apiRateLimit = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minuto
};

export const strictRateLimit = {
  limit: 3,
  windowMs: 60 * 60 * 1000, // 1 hora
};

/**
 * Verificador preconfigurado para login
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  return checkRateLimit(identifier, loginRateLimit);
}

/**
 * Verificador preconfigurado para endpoints API
 */
export function checkApiRateLimit(identifier: string): RateLimitResult {
  return checkRateLimit(identifier, apiRateLimit);
}
