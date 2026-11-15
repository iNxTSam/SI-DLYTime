'use strict';

const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(authenticate);

router.get('/crudCita', authorize(ROLES.EMPLEADO, ROLES.ADMIN), appointmentController.listAppointments);
router.get('/crudCitaCliente', appointmentController.listClientAppointments);

router.post('/addCita', appointmentController.createAppointment);
router.patch('/cancelCita', appointmentController.cancelAppointment);
router.patch(
  '/updateCita',
  authorize(ROLES.EMPLEADO, ROLES.ADMIN),
  appointmentController.updateAppointment
);

router.get('/getHorarios', appointmentController.listAvailableSlots);
router.get('/getEmpleados', appointmentController.listEmployees);
router.get('/getClientes', authorize(ROLES.EMPLEADO, ROLES.ADMIN), appointmentController.getClient);
router.get('/getTipoConsulta', appointmentController.listConsultationTypes);

module.exports = router;
