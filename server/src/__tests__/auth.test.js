'use strict';

jest.mock('../config/db');

const request = require('supertest');
const bcryptjs = require('bcryptjs');
const db = require('../config/db');
const { createApp } = require('../app');

const app = createApp();

const validUser = {
  numeroDocumento: 1234567890,
  idTipoIdentificacion: 1,
  nombre: 'Juan',
  apellido: 'Perez',
  idGenero: 1,
  correo: 'juan.perez@test.com',
  clave: 'Password123',
};

describe('POST /autenticacion/registro', () => {
  test('registra un usuario valido', async () => {
    db.one.mockResolvedValue(null);
    db.query.mockResolvedValue({ insertId: 1 });

    const response = await request(app).post('/autenticacion/registro').send(validUser);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Empleado registrado con éxito.');
  });

  test('rechaza documento o correo duplicado', async () => {
    db.one.mockResolvedValue({ numeroDocumento: 1 });

    const response = await request(app).post('/autenticacion/registro').send(validUser);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('USER_EXISTS');
  });

  test('rechaza datos incompletos', async () => {
    const response = await request(app)
      .post('/autenticacion/registro')
      .send({ ...validUser, correo: '' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('MISSING_FIELDS');
  });

  test('rechaza una contrasena debil', async () => {
    const response = await request(app)
      .post('/autenticacion/registro')
      .send({ ...validUser, clave: '123456' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('WEAK_PASSWORD');
  });

  test('ignora el rol enviado por el cliente y siempre crea un cliente', async () => {
    db.one.mockResolvedValue(null);
    db.query.mockResolvedValue({ insertId: 1 });

    await request(app)
      .post('/autenticacion/registro')
      .send({ ...validUser, idRol: 3 });

    const insertCall = db.query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO persona')
    );
    expect(insertCall).toBeDefined();
    // params: [documento, idRol, ...] -> el rol debe ser 1 (cliente)
    expect(insertCall[1][1]).toBe(1);
  });
});

describe('POST /autenticacion/login', () => {
  beforeEach(() => {
    process.env.LOGIN_MAX_ATTEMPTS = '5';
  });

  test('devuelve token con credenciales correctas', async () => {
    const hash = await bcryptjs.hash('Password123', 10);
    db.one.mockResolvedValue({
      numeroDocumento: 1234567890,
      clave: hash,
      idRol: 1,
      idEstadoPersona: 1,
      block_account: null,
      correo: 'juan.perez@test.com',
    });
    db.query.mockResolvedValue({ affectedRows: 1 });

    const response = await request(app)
      .post('/autenticacion/login')
      .send({ correo_i: 'juan.perez@test.com', password_i: 'Password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.rol).toBe(1);
  });

  test('no revela si el correo existe', async () => {
    db.one.mockResolvedValue(null);

    const response = await request(app)
      .post('/autenticacion/login')
      .send({ correo_i: 'nadie@test.com', password_i: 'Password123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Correo o contraseña incorrecta.');
  });

  test('rechaza contrasena incorrecta', async () => {
    const hash = await bcryptjs.hash('Password123', 10);
    db.one.mockResolvedValue({
      numeroDocumento: 1234567890,
      clave: hash,
      idRol: 1,
      idEstadoPersona: 1,
      block_account: null,
      correo: 'juan.perez@test.com',
    });

    const response = await request(app)
      .post('/autenticacion/login')
      .send({ correo_i: 'juan.perez@test.com', password_i: 'Incorrecta1' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('rechaza correo con formato invalido', async () => {
    const response = await request(app)
      .post('/autenticacion/login')
      .send({ correo_i: 'no-es-correo', password_i: 'Password123' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_EMAIL');
  });
});
