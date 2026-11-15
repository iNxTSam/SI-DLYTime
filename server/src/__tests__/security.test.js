'use strict';

jest.mock('../config/db');

const request = require('supertest');
const db = require('../config/db');
const { createApp } = require('../app');
const { signToken } = require('../utils/jwt');
const { ROLES } = require('../utils/roles');

const app = createApp();

const tokenFor = (id, rol) => signToken({ id, correo: `user${id}@test.com`, rol });

describe('Proteccion de rutas', () => {
  test('rechaza peticiones sin token', async () => {
    const response = await request(app).get('/crudClientes/consultaCliente');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('TOKEN_REQUIRED');
  });

  test('rechaza un token invalido', async () => {
    const response = await request(app)
      .get('/crudClientes/consultaCliente')
      .set('Authorization', 'Bearer token-falso');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('TOKEN_INVALID');
  });

  test('un cliente no puede listar todos los clientes', async () => {
    const response = await request(app)
      .get('/crudClientes/consultaCliente')
      .set('Authorization', `Bearer ${tokenFor(1, ROLES.CLIENTE)}`);

    expect(response.status).toBe(403);
  });

  test('un administrador si puede listar clientes', async () => {
    db.query.mockResolvedValue([]);

    const response = await request(app)
      .get('/crudClientes/consultaCliente')
      .set('Authorization', `Bearer ${tokenFor(999, ROLES.ADMIN)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('un empleado no puede crear empleados', async () => {
    const response = await request(app)
      .post('/crudEmpleados/agregarEmpleado')
      .set('Authorization', `Bearer ${tokenFor(2, ROLES.EMPLEADO)}`)
      .send({});

    expect(response.status).toBe(403);
  });

  test('ninguna ruta publica de escritura queda abierta', async () => {
    const response = await request(app).patch('/perfil/updateUsuarioAdmin').send({
      numeroDocumento: 1,
      password: 'Password123',
    });

    expect(response.status).toBe(401);
  });
});

describe('Propiedad de los datos en /perfil', () => {
  test('un cliente no puede leer el perfil de otra persona', async () => {
    const response = await request(app)
      .get('/perfil/datosUsuario?id=222')
      .set('Authorization', `Bearer ${tokenFor(111, ROLES.CLIENTE)}`);

    expect(response.status).toBe(403);
  });

  test('un cliente si puede leer su propio perfil', async () => {
    db.one.mockResolvedValue({
      numeroDocumento: 111,
      Nombres: 'Ana',
      Apellidos: 'Diaz',
      correo: 'ana@test.com',
    });

    const response = await request(app)
      .get('/perfil/datosUsuario?id=111')
      .set('Authorization', `Bearer ${tokenFor(111, ROLES.CLIENTE)}`);

    expect(response.status).toBe(200);
    expect(response.body.numeroDocumento).toBe(111);
  });

  test('un administrador puede leer el perfil de cualquiera', async () => {
    db.one.mockResolvedValue({ numeroDocumento: 222 });

    const response = await request(app)
      .get('/perfil/datosUsuario?id=222')
      .set('Authorization', `Bearer ${tokenFor(999, ROLES.ADMIN)}`);

    expect(response.status).toBe(200);
  });
});

describe('Salud del servicio', () => {
  test('GET /health responde ok', async () => {
    db.healthCheck.mockResolvedValue(undefined);

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
