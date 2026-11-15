'use strict';

const express = require('express');
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// La gestion de empleados queda reservada al administrador.
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/consultaEmpleado', employeeController.searchEmployees);
router.post('/agregarEmpleado', employeeController.createEmployee);
router.patch('/actualizarEmpleado', employeeController.updateEmployee);

module.exports = router;
