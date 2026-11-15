import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './RutaProtegida.jsx';

function renderWithRoute(allowedRoles) {
  return render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route
          path="/privada"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <p>contenido privado</p>
            </ProtectedRoute>
          }
        />
        <Route path="/Login" element={<p>formulario de login</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirige al login cuando no hay token', () => {
    renderWithRoute([1]);
    expect(screen.getByText('formulario de login')).toBeInTheDocument();
  });

  it('muestra el contenido cuando el rol está permitido', () => {
    localStorage.setItem('authToken', 'token-de-prueba');
    localStorage.setItem('userRole', '3');

    renderWithRoute([1, 2, 3]);

    expect(screen.getByText('contenido privado')).toBeInTheDocument();
  });

  it('redirige cuando el rol no está permitido', () => {
    localStorage.setItem('authToken', 'token-de-prueba');
    localStorage.setItem('userRole', '1');

    renderWithRoute([3]);

    expect(screen.getByText('formulario de login')).toBeInTheDocument();
  });
});
