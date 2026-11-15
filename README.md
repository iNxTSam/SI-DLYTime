# SI-DLYTime

Sistema de gestión de citas y historial clínico para consultorios oftalmológicos. Incluye tres clientes sobre una misma API REST:

| Componente | Stack | Carpeta |
| --- | --- | --- |
| API REST | Node.js · Express 4 · MySQL 8 | `server/` |
| Cliente web | React 18 · Vite 6 · React Router | `client/` |
| App móvil | React Native · Expo 52 · TypeScript | `client_Movil/` |

---

## Contenido

- [Funcionalidades](#funcionalidades)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [API](#api)
- [Seguridad](#seguridad)
- [Pruebas](#pruebas)
- [Docker](#docker)
- [Cambios respecto a la versión original](#cambios-respecto-a-la-versión-original)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Licencia](#licencia)

---

## Funcionalidades

**Clientes (rol 1)**
- Registro con verificación por código enviado al correo.
- Inicio de sesión y recuperación de contraseña.
- Agendar citas eligiendo tipo de consulta, especialista y horario disponible.
- Consultar y cancelar sus propias citas.
- Editar su perfil.

**Empleados (rol 2)**
- Ver y gestionar la agenda de citas.
- Consultar el historial clínico de los clientes y subir nuevos PDFs.
- Administrar horarios disponibles.

**Administradores (rol 3)**
- Todo lo anterior.
- CRUD de clientes y de empleados.
- Cambiar contraseñas de usuarios.
- Generar reportes en PDF del historial.

---

## Estructura del repositorio

```
.
├── database/               Scripts SQL (esquema, datos, rutinas)
├── server/                 API REST (Express)
│   ├── src/
│   │   ├── config/         Env y pool de MySQL
│   │   ├── middlewares/    Auth, roles, rate limit, uploads, errores
│   │   ├── controllers/    Entrada/salida HTTP
│   │   ├── services/       Acceso a datos y reglas de negocio
│   │   ├── routes/         Definición de rutas
│   │   └── utils/          JWT, validaciones, mailer, errores
│   ├── swagger/            Documentación OpenAPI
│   └── uploads/            PDFs subidos (ignorados por git)
├── client/                 App web (React + Vite)
│   └── src/
│       ├── api/            Cliente HTTP único (axios + token)
│       ├── components/     Piezas reutilizables
│       ├── pages/          Pantallas
│       ├── styles/         CSS
│       └── utils/          Roles y validaciones
└── client_Movil/           App móvil (Expo)
    └── src/
        ├── api/            Cliente HTTP único (axios + token)
        ├── views/          Pantallas
        └── types/          Tipos compartidos
```

---

## Requisitos

- **Node.js 18+** (probado con Node 24)
- **MySQL 8** o MariaDB 10.4+
- **npm 9+**
- Para la app móvil: la app **Expo Go** en el teléfono o un emulador

---

## Puesta en marcha

### 1. Base de datos

```bash
# Crea la base, las tablas y los catálogos
mysql -u root -p < database/schema.sql
mysql -u root -p dlytime < database/seed.sql

# Opcional: procedimiento + evento que generan horarios a 21 días
mysql -u root -p dlytime < database/routines.sql
```

Con Docker no hace falta este paso, ver [Docker](#docker).

### 2. API

```bash
cd server
copy .env.example .env      # Windows
# cp .env.example .env      # Linux / macOS
```

Edita `server/.env` con tus credenciales de MySQL y un `JWT_SECRET` propio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Luego:

```bash
npm install
npm run dev        # http://localhost:3001
```

- Documentación interactiva: <http://localhost:3001/api-docs>
- Estado del servicio: <http://localhost:3001/health>

### 3. Cliente web

```bash
cd client
copy .env.example .env.local
npm install
npm run dev        # http://localhost:5173
```

### 4. App móvil

```bash
cd client_Movil
copy .env.example .env
npm install
npm start
```

> En un teléfono físico, `EXPO_PUBLIC_API_URL` debe apuntar a la IP local de tu equipo (por ejemplo `http://192.168.0.10:3001`), no a `localhost`.

### 5. Todo junto desde la raíz

```bash
npm install
npm run install:all
npm run dev        # levanta API + web en paralelo
```

### Usuarios de ejemplo

Creados por `database/seed.sql`. La contraseña de todos es `Demo12345`.

| Correo | Rol |
| --- | --- |
| `cliente@example.com` | Cliente |
| `empleado@example.com` | Empleado |
| `oftalmologo@example.com` | Empleado |
| `admin@example.com` | Administrador |

---

## Variables de entorno

### `server/.env`

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `PORT` | `3001` | Puerto de la API |
| `NODE_ENV` | `development` | `production` activa validaciones estrictas |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Orígenes permitidos, separados por coma |
| `JWT_SECRET` | — | **Obligatorio en producción**, mínimo 32 caracteres |
| `JWT_EXPIRES_IN` | `1h` | Vigencia del token |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | Servidor MySQL |
| `DB_USER` / `DB_PASSWORD` | `root` / vacío | Credenciales de MySQL |
| `DB_NAME` | `dlytime` | Nombre de la base |
| `MAIL_USER` / `MAIL_APP_PASSWORD` | vacío | Cuenta de Gmail y contraseña de aplicación |
| `MAIL_FROM` | `SI-DLYTime <no-reply@dlytime.local>` | Remitente |
| `SUPPORT_MAIL_TO` | `MAIL_USER` | Destino de las solicitudes de soporte |
| `UPLOAD_MAX_MB` | `10` | Tamaño máximo del PDF del historial |
| `LOGIN_MAX_ATTEMPTS` | `5` | Intentos antes de bloquear la cuenta |
| `LOGIN_BLOCK_MINUTES` | `10` | Duración del bloqueo |
| `PASSWORD_RESET_TTL_MINUTES` | `15` | Vigencia del código de recuperación |

Si `MAIL_USER` está vacío, los endpoints de correo no fallan: responden correctamente y el código se imprime en la consola del servidor (solo en desarrollo).

### `client/.env.local`

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3001` | URL base de la API |

### `client_Movil/.env`

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3001` | URL base de la API |

---

## Scripts disponibles

**Raíz**

| Comando | Acción |
| --- | --- |
| `npm run install:all` | Instala dependencias de los tres proyectos |
| `npm run dev` | API + web en paralelo |
| `npm run dev:mobile` | Expo |
| `npm test` | Tests de API y web |
| `npm run build` | Build de producción del cliente web |

**`server/`**

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor con recarga automática |
| `npm start` | Servidor en modo normal |
| `npm test` | Jest + Supertest |

**`client/`**

| Comando | Acción |
| --- | --- |
| `npm run dev` | Vite en el puerto 5173 |
| `npm run build` | Build a `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm test` | Vitest + Testing Library |

---

## API

Base: `http://localhost:3001`. Documentación completa en `/api-docs`.

### Públicas

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/autenticacion/registro` | Registro de cliente |
| POST | `/autenticacion/login` | Login (`correo_i`, `password_i`) |
| POST | `/autenticacion/verificarCodigo` | Valida el código de registro |
| POST | `/recuperarPassword/validarCodigo` | Valida el código de recuperación |
| PATCH | `/recuperarPassword/cambiarPassword` | Cambia la contraseña |
| POST | `/enviarCorreo/enviarCorreoRegistro` | Envía código de registro |
| POST | `/enviarCorreo/enviarCorreoPassword` | Envía código de recuperación |
| POST | `/enviarCorreo/enviar-soporte` | Formulario de soporte |
| GET | `/miniConsultaSelect/consultarIdentificacion` | Catálogo de tipos de documento |
| GET | `/miniConsultaSelect/consultarGenero` | Catálogo de géneros |
| GET | `/miniConsultaSelect/consultarEstado` | Catálogo de estados |
| GET | `/health` | Estado del servicio y de la base |

### Protegidas (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Roles |
| --- | --- | --- |
| GET | `/perfil/datosUsuario?id=` | Propio usuario o admin |
| PATCH | `/perfil/updateUsuario` | Propio usuario o admin |
| PATCH | `/perfil/updateUsuarioAdmin` | Admin |
| GET | `/crudCitas/crudCita` | Empleado, admin |
| GET | `/crudCitas/crudCitaCliente?id=` | Cliente (propias), empleado, admin |
| POST | `/crudCitas/addCita` | Todos (el cliente agenda para sí) |
| PATCH | `/crudCitas/cancelCita` | Todos |
| PATCH | `/crudCitas/updateCita` | Empleado, admin |
| GET | `/crudCitas/getHorarios?fecha=` | Todos |
| GET | `/crudCitas/getEmpleados` | Todos |
| GET | `/crudCitas/getClientes` | Empleado, admin |
| GET | `/crudCitas/getTipoConsulta` | Todos |
| GET | `/crudClientes/consultaCliente` | Empleado, admin |
| POST | `/crudClientes/agregarCliente` | Admin |
| PATCH | `/crudClientes/actualizarCliente` | Empleado, admin |
| POST | `/crudClientes/agregarHistorialClinico` | Empleado, admin |
| GET | `/crudClientes/consultaHistorialClinico/:documento` | Empleado, admin |
| GET | `/crudEmpleados/consultaEmpleado` | Admin |
| POST | `/crudEmpleados/agregarEmpleado` | Admin |
| PATCH | `/crudEmpleados/actualizarEmpleado` | Admin |

Los errores siguen un formato uniforme:

```json
{ "message": "Texto para el usuario", "code": "CODIGO_DE_NEGOCIO" }
```

---

## Seguridad

Lo que quedó implementado en esta versión:

- **JWT obligatorio** en todas las rutas de datos. Antes el token se generaba pero nunca se verificaba: cualquiera podía leer o modificar la información con solo conocer la URL.
- **Autorización por roles** y por propiedad del recurso (un cliente solo ve sus citas y su perfil).
- **Secretos fuera del código**: JWT, credenciales de MySQL y de correo viven en `.env`.
- **Rate limiting** en login, recuperación de contraseña y correo.
- **Bloqueo de cuenta por usuario**, no global (el contador anterior era una variable compartida por todos).
- **Contraseñas** con bcrypt (10 rondas) y regla mínima de complejidad en los flujos donde el usuario elige su clave.
- **Códigos de recuperación** generados con `crypto` en lugar de `Math.random`, con expiración y límite de intentos.
- **Validación y normalización** de todos los cuerpos de petición.
- **Cabeceras de seguridad** con Helmet y CORS restringido.
- **Subida de archivos**: solo PDF, tamaño máximo configurable y nombre generado por el servidor (evita path traversal).
- **Consultas parametrizadas** en el 100% de las sentencias SQL.
- **Sin datos sensibles en las respuestas**: se eliminó el `SELECT persona.*` que devolvía el hash de la contraseña.

---

## Pruebas

```bash
npm test            # raíz: API + web

cd server && npm test   # 19 pruebas (Jest + Supertest)
cd client && npm test   # 7 pruebas (Vitest + Testing Library)
```

Cobertura actual:

- Registro: éxito, duplicados, campos faltantes, contraseña débil, escalada de rol.
- Login: credenciales correctas, correo inexistente, contraseña incorrecta, formato inválido.
- Rutas protegidas: sin token, token inválido, rol insuficiente.
- Propiedad de datos en `/perfil`.
- `ProtectedRoute` y validaciones del cliente.

---

## Docker

```bash
docker compose up -d
```

Levanta MySQL 8 en el puerto `3307` y ejecuta automáticamente `database/schema.sql` y `database/seed.sql`. Ajusta `server/.env`:

```
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=dlytime
DB_PASSWORD=dlytime
DB_NAME=dlytime
```

---

## Cambios respecto a la versión original

**Corregido**

| Problema | Detalle |
| --- | --- |
| API sin autenticación | El token se generaba pero ninguna ruta lo verificaba |
| Escalada de privilegios | `/autenticacion/registro` aceptaba `idRol` del cliente: se podía crear un administrador |
| Credenciales expuestas | App password de Gmail, JWT secret y claves de Emailvalidation en el código |
| Datos de pacientes en el repo | 7 historiales clínicos en PDF dentro de `server/uploads` |
| Fuga de hashes | `SELECT persona.*` enviaba `clave`, `reset_code` y `block_account` al navegador |
| Búsqueda de empleados rota | Usaba el alias `p.numeroDocumento`, inexistente en la consulta |
| Bloqueo de login global | El contador de intentos era una única variable para todos los usuarios |
| Cambio de contraseña sin validar | `cambiarPassword` no comprobaba el código ni su expiración |
| Rutas duplicadas en React | `App.js` declaraba cada ruta dos veces con roles distintos |
| Case sensitivity | `require("./Config/db")` contra la carpeta `config/` y tablas `Horario`/`detalleCita` rompían en Linux |
| Perfil sin contraseña | Guardar el perfil sin cambiar la clave lanzaba un error de bcrypt |
| Actualización de citas | `updateCita` fallaba si el horario anterior no cambiaba |

**Modernizado**

- `mysql` → `mysql2/promise` con pool, `async/await` y transacciones reales.
- Backend en capas: `routes` → `controllers` → `services`.
- `server/package.json`: de 156 dependencias declaradas a 12 reales.
- Cliente web migrado de Create React App a **Vite 6**.
- Cliente HTTP único en web y móvil, con inyección de token y manejo de 401.
- URLs del API por variable de entorno (ya no hay `localhost:3001` ni IPs fijas).
- Estructura del cliente web: `pages/`, `components/`, `styles/`, `api/`, `utils/`.
- Bootstrap servido desde `node_modules` en lugar de un CDN.
- `multer` 2.x, `helmet` y `express-rate-limit` añadidos.

---

## Limitaciones conocidas

- La verificación del correo de registro se exige en la interfaz web, pero el endpoint `/autenticacion/registro` sigue aceptando altas sin código para no romper la app móvil, que no tiene ese paso. Si se quiere cerrar por completo, hay que añadir el flujo a la app móvil.
- Los PDFs de `/uploads` se sirven como archivos estáticos con nombre aleatorio (no enumerable). Para acceso estrictamente autenticado hay que mover la descarga a un endpoint que valide el token.
- Los intentos fallidos de login se guardan en memoria: se reinician al reiniciar el proceso y no se comparten entre instancias.
- La contraseña inicial de un cliente creado desde el panel es su número de documento (comportamiento heredado).
- Falta paginación en los listados; funcionan bien con los volúmenes actuales.
- No hay tests de la app móvil.

---

## Migración desde la versión anterior

Si ya tienes una base `dlytime` en uso:

1. Compara tu esquema con `database/schema.sql`. Los cambios principales son:
   - `persona.numeroDocumento` y las columnas que lo referencian pasan de `INT` a `BIGINT`.
   - `persona.correo` ahora tiene índice `UNIQUE`.
   - `persona.reset_code` pasa de `VARCHAR(6)` a `VARCHAR(64)`.
   - Todos los nombres de tabla se normalizaron a minúsculas.
2. Antes de aplicar el índice único, revisa duplicados:

   ```sql
   SELECT correo, COUNT(*) FROM persona GROUP BY correo HAVING COUNT(*) > 1;
   ```

3. Los secretos del `.env` anterior (JWT y app password de Gmail) deben considerarse comprometidos: **revócalos y genera nuevos**.

---

## Licencia

MIT. Ver [LICENSE](LICENSE).
