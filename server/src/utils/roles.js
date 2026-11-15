'use strict';

/** Roles tal como estan definidos en la tabla Rol. */
const ROLES = Object.freeze({
  CLIENTE: 1,
  EMPLEADO: 2,
  ADMIN: 3,
});

const ROLE_NAMES = Object.freeze({
  1: 'Cliente',
  2: 'Empleado',
  3: 'Administrador',
});

module.exports = { ROLES, ROLE_NAMES };
