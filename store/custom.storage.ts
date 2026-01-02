import { StateStorage, createJSONStorage } from 'zustand/middleware';

/**
 * Almacenamiento en memoria para datos sensibles de sesión
 * NO usa sessionStorage para evitar exposición a ataques XSS
 */
const memoryStorage = new Map<string, string>();

const storageApi: StateStorage = {
  getItem: function (name: string): string | Promise<string | null> | null {
    // Usar memoria en lugar de sessionStorage para mayor seguridad
    return memoryStorage.get(name) ?? null;
  },

  setItem: function (name: string, value: string): void {
    // Usar memoria en lugar de sessionStorage
    memoryStorage.set(name, value);
  },

  removeItem: function (name: string): void | Promise<void> {
    memoryStorage.delete(name);
  }
};

export const customSessionStorage = createJSONStorage(() => storageApi);