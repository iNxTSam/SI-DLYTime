import { describe, expect, it } from 'vitest';
import { EMAIL_REGEX, isStrongPassword, isValidEmail } from './validation';

describe('validación de correo', () => {
  it('acepta correos válidos', () => {
    expect(isValidEmail('sam@uniempresarial.edu.co')).toBe(true);
    expect(isValidEmail('a.b+c@dominio.com')).toBe(true);
  });

  it('rechaza correos inválidos', () => {
    expect(isValidEmail('sin-arroba.com')).toBe(false);
    expect(isValidEmail('correo@sin-dominio')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('expone la expresión regular reutilizable', () => {
    expect(EMAIL_REGEX.test('test@test.com')).toBe(true);
  });
});

describe('validación de contraseña', () => {
  it('exige mínimo 8 caracteres, una mayúscula y un número', () => {
    expect(isStrongPassword('Password123')).toBe(true);
    expect(isStrongPassword('password123')).toBe(false);
    expect(isStrongPassword('Password')).toBe(false);
    expect(isStrongPassword('Pass1')).toBe(false);
  });
});
