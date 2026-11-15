-- ---------------------------------------------------------------------------
-- Datos iniciales de SI-DLYTime (catalogos + un usuario por rol).
-- Las cuentas de ejemplo usan correos @example.com y contrasenas que NO se
-- publican: cambialas antes de usar el sistema en un entorno real.
-- ---------------------------------------------------------------------------

USE dlytime;

INSERT INTO tipoidentificacion (idTipoIdentificacion, nombre) VALUES
  (1, 'CÃ©dula'),
  (2, 'Pasaporte'),
  (3, 'RUC')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO genero (idGenero, nombre) VALUES
  (1, 'Masculino'),
  (2, 'Femenino'),
  (3, 'Otro')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO estadopersona (idEstado, nombre) VALUES
  (1, 'Activo'),
  (2, 'Inactivo'),
  (3, 'Bloqueado')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO rol (idRol, nombre) VALUES
  (1, 'Usuario'),
  (2, 'Empleado'),
  (3, 'Administrador')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Usuarios de demostracion.
--   cliente@example.com     -> rol 1
--   empleado@example.com    -> rol 2
--   oftalmologo@example.com -> rol 2
--   admin@example.com       -> rol 3
-- La contrasena inicial de todas estas cuentas es Demo12345
-- (hash bcrypt generado con bcryptjs, 10 rondas).
INSERT INTO persona
  (numeroDocumento, idRol, idTipoIdentificacion, Nombres, Apellidos, idGenero,
   correo, telefono, clave, fechaNacimiento, direccion, idEstadoPersona)
VALUES
  (123456789, 1, 1, 'Juan', 'PÃ©rez', 1, 'cliente@example.com', '555-1234',
   '$2a$10$gTV1LLnWiN7YFrknNiK6W.AiTd36Nle3u.7LSEDQJbzeEQvALRvOO',
   '1990-01-01', 'Calle 1', 1),
  (987654321, 2, 1, 'MarÃ­a', 'GÃ³mez', 2, 'empleado@example.com', '555-5678',
   '$2a$10$gTV1LLnWiN7YFrknNiK6W.AiTd36Nle3u.7LSEDQJbzeEQvALRvOO',
   '1985-05-05', 'Calle 2', 1),
  (987653231, 2, 2, 'Natalia', 'Bautista', 2, 'oftalmologo@example.com', '555-9012',
   '$2a$10$gTV1LLnWiN7YFrknNiK6W.AiTd36Nle3u.7LSEDQJbzeEQvALRvOO',
   '1985-06-06', 'Calle 3', 1),
  (1013110701, 3, 1, 'Sebastian', 'RodrÃ­guez', 1, 'admin@example.com', '555-3456',
   '$2a$10$gTV1LLnWiN7YFrknNiK6W.AiTd36Nle3u.7LSEDQJbzeEQvALRvOO',
   '1985-06-06', 'Calle 4', 1)
ON DUPLICATE KEY UPDATE
  Nombres = VALUES(Nombres), Apellidos = VALUES(Apellidos);

INSERT INTO tipoproblema (idTipoProblema, descripcion) VALUES
  (1, 'Problema de software'),
  (2, 'Problema de hardware')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO estadocita (idEstadocita, nombre) VALUES
  (1, 'Pendiente'),
  (2, 'Confirmada'),
  (3, 'Cancelada')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO estadohorario (idEstadoHorario, nombre) VALUES
  (1, 'Disponible'),
  (2, 'No disponible')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO tipoconsulta (idtipoConsulta, nombre) VALUES
  (1, 'Consulta general'),
  (2, 'Chequeo')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO diagnostico (idDiagnostico, descripcion) VALUES
  (1, 'Sin diagnostico'),
  (2, 'Control rutinario')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- Horarios de ejemplo para los proximos 7 dias (10:00 a 16:00 cada hora).
-- database/routines.sql contiene el procedimiento que los genera solo.
INSERT INTO horario (idHorarios, fecha, hora, estadoHorario)
SELECT
  1000 + (DATEDIFF(d.fecha, CURDATE()) * 10) + h.orden AS idHorarios,
  d.fecha,
  h.hora,
  1
FROM (
  SELECT CURDATE() + INTERVAL 0 DAY AS fecha
  UNION ALL SELECT CURDATE() + INTERVAL 1 DAY
  UNION ALL SELECT CURDATE() + INTERVAL 2 DAY
  UNION ALL SELECT CURDATE() + INTERVAL 3 DAY
  UNION ALL SELECT CURDATE() + INTERVAL 4 DAY
  UNION ALL SELECT CURDATE() + INTERVAL 5 DAY
  UNION ALL SELECT CURDATE() + INTERVAL 6 DAY
) AS d
CROSS JOIN (
  SELECT 1 AS orden, '10:00:00' AS hora
  UNION ALL SELECT 2, '11:00:00'
  UNION ALL SELECT 3, '12:00:00'
  UNION ALL SELECT 4, '14:00:00'
  UNION ALL SELECT 5, '15:00:00'
  UNION ALL SELECT 6, '16:00:00'
) AS h
ON DUPLICATE KEY UPDATE estadoHorario = horario.estadoHorario;
