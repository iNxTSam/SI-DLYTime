-- ---------------------------------------------------------------------------
-- SI-DLYTime - Esquema de base de datos
-- MySQL 8.x / MariaDB 10.4+
--
-- Uso:
--   mysql -u root -p < database/schema.sql
--   mysql -u root -p dlytime < database/seed.sql
--   mysql -u root -p dlytime < database/routines.sql   (opcional)
--
-- Nota: todos los identificadores estan en minusculas. MySQL en Linux es
-- sensible a mayusculas en nombres de tabla, por lo que el esquema original
-- (Horario, detalleCita, estadosCita...) fallaba fuera de Windows.
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS dlytime
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dlytime;

CREATE TABLE IF NOT EXISTS tipoidentificacion (
  idTipoIdentificacion INT NOT NULL,
  nombre VARCHAR(35) NOT NULL,
  PRIMARY KEY (idTipoIdentificacion)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS genero (
  idGenero INT NOT NULL,
  nombre VARCHAR(10) NOT NULL,
  PRIMARY KEY (idGenero)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS estadopersona (
  idEstado INT NOT NULL,
  nombre VARCHAR(10) NOT NULL,
  PRIMARY KEY (idEstado)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS rol (
  idRol INT NOT NULL,
  nombre VARCHAR(20) NOT NULL,
  PRIMARY KEY (idRol)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS persona (
  numeroDocumento BIGINT NOT NULL,
  idRol INT NOT NULL,
  idTipoIdentificacion INT NOT NULL,
  Nombres VARCHAR(30) NOT NULL,
  Apellidos VARCHAR(30) NOT NULL,
  idGenero INT NOT NULL,
  correo VARCHAR(50) NOT NULL,
  telefono VARCHAR(15) NULL,
  clave VARCHAR(61) NOT NULL,
  fechaNacimiento DATE NULL,
  direccion VARCHAR(40) NULL,
  idEstadoPersona INT NOT NULL,
  reset_code VARCHAR(64) NULL,
  reset_expires DATETIME NULL,
  block_account DATETIME NULL,
  PRIMARY KEY (numeroDocumento),
  UNIQUE KEY uq_persona_correo (correo),
  KEY idx_persona_rol (idRol),
  CONSTRAINT fk_persona_tipoidentificacion
    FOREIGN KEY (idTipoIdentificacion) REFERENCES tipoidentificacion (idTipoIdentificacion),
  CONSTRAINT fk_persona_genero
    FOREIGN KEY (idGenero) REFERENCES genero (idGenero),
  CONSTRAINT fk_persona_rol
    FOREIGN KEY (idRol) REFERENCES rol (idRol),
  CONSTRAINT fk_persona_estado
    FOREIGN KEY (idEstadoPersona) REFERENCES estadopersona (idEstado)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tipoproblema (
  idTipoProblema INT NOT NULL,
  descripcion VARCHAR(45) NOT NULL,
  PRIMARY KEY (idTipoProblema)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS soporte (
  idSoporte INT NOT NULL,
  idTipoProblema INT NOT NULL,
  numeroDocumento BIGINT NOT NULL,
  descripcionProblema VARCHAR(250) NOT NULL,
  PRIMARY KEY (idSoporte),
  CONSTRAINT fk_soporte_tipoproblema
    FOREIGN KEY (idTipoProblema) REFERENCES tipoproblema (idTipoProblema),
  CONSTRAINT fk_soporte_persona
    FOREIGN KEY (numeroDocumento) REFERENCES persona (numeroDocumento)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS estadocita (
  idEstadocita INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  PRIMARY KEY (idEstadocita)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS estadohorario (
  idEstadoHorario INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  PRIMARY KEY (idEstadoHorario)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS horario (
  idHorarios INT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estadoHorario INT NOT NULL,
  PRIMARY KEY (idHorarios),
  KEY idx_horario_fecha_estado (fecha, estadoHorario),
  CONSTRAINT horario_fk
    FOREIGN KEY (estadoHorario) REFERENCES estadohorario (idEstadoHorario)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tipoconsulta (
  idtipoConsulta INT NOT NULL,
  nombre VARCHAR(30) NOT NULL,
  PRIMARY KEY (idtipoConsulta)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS diagnostico (
  idDiagnostico INT NOT NULL AUTO_INCREMENT,
  descripcion VARCHAR(300) NOT NULL,
  PRIMARY KEY (idDiagnostico)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS historialclinico (
  numeroDocumento BIGINT NOT NULL,
  idDiagnostico INT NOT NULL,
  PRIMARY KEY (numeroDocumento),
  CONSTRAINT fk_historial_persona
    FOREIGN KEY (numeroDocumento) REFERENCES persona (numeroDocumento),
  CONSTRAINT fk_historial_diagnostico
    FOREIGN KEY (idDiagnostico) REFERENCES diagnostico (idDiagnostico)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS cita (
  idCita INT NOT NULL AUTO_INCREMENT,
  NumeroDocumentoCliente BIGINT NOT NULL,
  NumeroDocumentoOftalmologo BIGINT NOT NULL,
  PRIMARY KEY (idCita),
  KEY idx_cita_cliente (NumeroDocumentoCliente),
  CONSTRAINT fk_cita_cliente
    FOREIGN KEY (NumeroDocumentoCliente) REFERENCES persona (numeroDocumento),
  CONSTRAINT fk_cita_oftalmologo
    FOREIGN KEY (NumeroDocumentoOftalmologo) REFERENCES persona (numeroDocumento)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS detallecita (
  idCita INT NOT NULL,
  idDiagnostico INT NULL,
  idTipoConsulta INT NOT NULL,
  idHorarios INT NOT NULL,
  idEstadoCita INT NOT NULL,
  direccion VARCHAR(40) NULL,
  PRIMARY KEY (idCita),
  CONSTRAINT fk_detalle_diagnostico
    FOREIGN KEY (idDiagnostico) REFERENCES diagnostico (idDiagnostico),
  CONSTRAINT fk_detalle_tipoconsulta
    FOREIGN KEY (idTipoConsulta) REFERENCES tipoconsulta (idtipoConsulta),
  CONSTRAINT fk_detalle_horario
    FOREIGN KEY (idHorarios) REFERENCES horario (idHorarios),
  CONSTRAINT fk_detalle_estado
    FOREIGN KEY (idEstadoCita) REFERENCES estadocita (idEstadocita),
  CONSTRAINT fk_detalle_cita
    FOREIGN KEY (idCita) REFERENCES cita (idCita)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS clientes_historial (
  idHistorial INT NOT NULL AUTO_INCREMENT,
  numeroDocumento BIGINT NULL,
  descripcion TEXT NULL,
  archivoPDF VARCHAR(255) NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idHistorial),
  KEY idx_historial_persona (numeroDocumento),
  CONSTRAINT fk_historial_archivo_persona
    FOREIGN KEY (numeroDocumento) REFERENCES persona (numeroDocumento) ON DELETE CASCADE
) ENGINE = InnoDB;
