'use strict';

const express = require('express');
const clientController = require('../controllers/client.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadHistorial } = require('../middlewares/upload');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(authenticate);

router.get('/consultaCliente', authorize(ROLES.EMPLEADO, ROLES.ADMIN), clientController.searchClients);
router.get(
  '/consultaClienteDocumento/:numeroDocumento',
  authorize(ROLES.EMPLEADO, ROLES.ADMIN),
  clientController.getClient
);
router.post('/agregarCliente', authorize(ROLES.ADMIN), clientController.createClient);
router.patch('/actualizarCliente', authorize(ROLES.EMPLEADO, ROLES.ADMIN), clientController.updateClient);

router.post(
  '/agregarHistorialClinico',
  authorize(ROLES.EMPLEADO, ROLES.ADMIN),
  uploadHistorial,
  clientController.uploadClinicalRecord
);
router.get(
  '/consultaHistorialClinico/:numeroDocumento',
  authorize(ROLES.EMPLEADO, ROLES.ADMIN),
  clientController.listClinicalRecords
);

module.exports = router;
