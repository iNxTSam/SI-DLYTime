/** Roles del sistema, alineados con la tabla `rol` de la base de datos. */
export const ROLES = Object.freeze({
  CLIENTE: 1,
  EMPLEADO: 2,
  ADMIN: 3,
});

export const ROLE_LABELS = Object.freeze({
  1: 'Cliente',
  2: 'Empleado',
  3: 'Administrador',
});

/** Ruta de inicio segun el rol autenticado. */
export function homeRouteFor(role) {
  switch (Number(role)) {
    case ROLES.ADMIN:
      return '/IndexAdmin';
    case ROLES.EMPLEADO:
      return '/IndexEmpleado';
    case ROLES.CLIENTE:
      return '/IndexCliente';
    default:
      return '/Login';
  }
}
