import { Navigate, Route, Routes } from 'react-router-dom';

import AdministrarHorarios from './pages/AdministrarHorarios.jsx';
import AgendarCita from './pages/AgendarCita.jsx';
import ClienteAdCitas from './pages/ClienteAdCitas.jsx';
import CrudCita from './pages/CrudCita.jsx';
import CrudClientes from './pages/CrudClientes.jsx';
import CrudClientesEmpleado from './pages/CrudClientesEmpleado.jsx';
import CrudEmpleados from './pages/CrudEmpleados.jsx';
import EmpleadoAdCitas from './pages/EmpleadoAdCitas.jsx';
import Home from './pages/Home/index.jsx';
import IndexAdmin from './pages/IndexAdmin.jsx';
import IndexCliente from './pages/IndexCliente.jsx';
import IndexEmpleado from './pages/IndexEmpleado.jsx';
import Login from './pages/Login.jsx';
import Perfil from './pages/Perfil.jsx';
import SignIn from './pages/SignIn.jsx';
import ProtectedRoute from './components/RutaProtegida.jsx';
import { ROLES } from './utils/roles.js';

/**
 * Rutas de la aplicación.
 *
 * El archivo original declaraba cada ruta dos veces con roles distintos y, en
 * React Router, solo la última definición aplica: eso hacía impredecible el
 * control de acceso en el cliente.
 */
export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/SignIn" element={<SignIn />} />

        <Route
          path="/IndexCliente"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENTE]}>
              <IndexCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/IndexEmpleado"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLEADO]}>
              <IndexEmpleado />
            </ProtectedRoute>
          }
        />
        <Route
          path="/IndexAdmin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <IndexAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Perfil"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENTE, ROLES.EMPLEADO, ROLES.ADMIN]}>
              <Perfil />
            </ProtectedRoute>
          }
        />

        <Route
          path="/AgendarCita"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENTE]}>
              <AgendarCita />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ClienteAdCitas"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENTE]}>
              <ClienteAdCitas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/EmpleadoAdCitas"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLEADO]}>
              <EmpleadoAdCitas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CrudCita"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLEADO, ROLES.ADMIN]}>
              <CrudCita />
            </ProtectedRoute>
          }
        />
        <Route
          path="/AdministrarHorarios"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLEADO, ROLES.ADMIN]}>
              <AdministrarHorarios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/CrudClientes"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <CrudClientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CrudEmpleados"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <CrudEmpleados />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CrudClientesEmpleado"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLEADO, ROLES.ADMIN]}>
              <CrudClientesEmpleado />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
