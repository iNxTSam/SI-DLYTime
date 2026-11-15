import { Navigate, useLocation } from 'react-router-dom';

/**
 * Protege una ruta verificando que exista sesion y que el rol este permitido.
 *
 * El nombre de la prop cambio de `requiredRole` a `allowedRoles` para que el
 * uso sea explicito, pero se acepta el anterior por compatibilidad.
 */
export default function ProtectedRoute({ children, allowedRoles, requiredRole }) {
  const location = useLocation();

  const token = localStorage.getItem('authToken');
  const role = Number(localStorage.getItem('userRole'));
  const roles = allowedRoles ?? requiredRole;

  if (!token) {
    return <Navigate to="/Login" state={{ from: location.pathname }} replace />;
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/Login" replace />;
  }

  return children;
}
