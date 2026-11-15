'use strict';

const express = require('express');
const catalogController = require('../controllers/catalog.controller');

const router = express.Router();

// Catalogos publicos: los necesita el formulario de registro antes del login.
router.get('/consultarIdentificacion', catalogController.listIdentificationTypes);
router.get('/consultarGenero', catalogController.listGenders);
router.get('/consultarEstado', catalogController.listPersonStatuses);

module.exports = router;
