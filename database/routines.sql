-- ---------------------------------------------------------------------------
-- Rutinas opcionales de SI-DLYTime.
--
-- Crea el procedimiento que genera horarios para los proximos 21 dias y el
-- evento que lo ejecuta a diario.
--
-- Requiere privilegios altos (CREATE ROUTINE / EVENT) y el planificador de
-- eventos activo. En MySQL gestionado (RDS, PlanetScale, Railway, etc.) el
-- event_scheduler suele estar deshabilitado: en ese caso ejecuta solo el
-- CALL final desde un cron externo.
-- ---------------------------------------------------------------------------

USE dlytime;

SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS insertarHorariosEvento;
DROP PROCEDURE IF EXISTS insertarHorariosTresSemanas;

DELIMITER //

CREATE PROCEDURE insertarHorariosTresSemanas()
BEGIN
  DECLARE fechaActual DATE;
  DECLARE fechaObjetivo DATE;
  DECLARE idHorario INT;

  SET fechaActual = CURDATE();
  SET fechaObjetivo = CURDATE() + INTERVAL 21 DAY;

  SELECT COALESCE(MAX(idHorarios), 0) INTO idHorario FROM horario;

  WHILE fechaActual <= fechaObjetivo DO
    IF NOT EXISTS (SELECT 1 FROM horario WHERE fecha = fechaActual) THEN
      INSERT INTO horario (idHorarios, fecha, hora, estadoHorario)
      SELECT
        (idHorario + ROW_NUMBER() OVER (ORDER BY hora))
          + DATEDIFF(fechaActual, CURDATE()) * 100 AS idHorarios,
        fechaActual,
        t.hora,
        1
      FROM (
        SELECT '10:00:00' AS hora
        UNION ALL SELECT '10:30:00'
        UNION ALL SELECT '11:00:00'
        UNION ALL SELECT '11:30:00'
        UNION ALL SELECT '12:00:00'
        UNION ALL SELECT '12:30:00'
        UNION ALL SELECT '13:00:00'
        UNION ALL SELECT '13:30:00'
        UNION ALL SELECT '14:00:00'
        UNION ALL SELECT '14:30:00'
        UNION ALL SELECT '15:00:00'
        UNION ALL SELECT '15:30:00'
        UNION ALL SELECT '16:00:00'
        UNION ALL SELECT '16:30:00'
        UNION ALL SELECT '17:00:00'
        UNION ALL SELECT '17:30:00'
        UNION ALL SELECT '18:00:00'
        UNION ALL SELECT '18:30:00'
        UNION ALL SELECT '19:00:00'
      ) AS t
      ORDER BY t.hora;
    END IF;

    SET fechaActual = fechaActual + INTERVAL 1 DAY;
  END WHILE;
END //

DELIMITER ;

CREATE EVENT IF NOT EXISTS insertarHorariosEvento
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '00:00:00')
DO
  CALL insertarHorariosTresSemanas();

CALL insertarHorariosTresSemanas();
