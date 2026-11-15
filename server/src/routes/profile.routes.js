'use strict';

const express = require('express');
const profileController = require('../controllers/profile.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(authenticate);

router.get('/datosUsuario', profileController.getProfile);
router.patch('/updateUsuario', profileController.updateProfile);
router.patch(
  '/updateUsuarioAdmin',
  authorize(ROLES.ADMIN),
  profileController.setUserPassword
);

module.exports = router;
