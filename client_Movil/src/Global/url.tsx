/**
 * Configuración del entorno de la app móvil.
 *
 * La URL del API se toma de EXPO_PUBLIC_API_URL (Expo la inyecta en tiempo de
 * build). Si no está definida se usa localhost, que funciona en el emulador de
 * iOS y en la web; en Android usa 10.0.2.2 y en un dispositivo físico la IP
 * de tu equipo en la red local.
 *
 * Ejemplo (.env en client_Movil):
 *   EXPO_PUBLIC_API_URL=http://192.168.0.10:3001
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

export const url = () => API_URL;
