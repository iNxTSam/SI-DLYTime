/**
 * Cliente HTTP unico de la aplicacion.
 *
 * - La URL base se toma de VITE_API_URL (por defecto http://localhost:3001).
 * - Inyecta el token guardado en localStorage en cada peticion.
 * - Si el servidor responde 401, limpia la sesion y manda al login.
 */
import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

const SESSION_KEYS = ['authToken', 'userRole', 'userId'];

export function clearSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      clearSession();
      if (!window.location.pathname.toLowerCase().includes('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

/** Devuelve el mensaje de error del backend o un texto generico. */
export function getErrorMessage(error, fallback = 'Ocurrio un error inesperado.') {
  return error?.response?.data?.message || fallback;
}

export default http;
