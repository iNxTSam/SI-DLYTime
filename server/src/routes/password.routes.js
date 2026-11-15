'use strict';

const express = require('express');
const passwordController = require('../controllers/password.controller');
const { passwordResetLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.post('/validarCodigo', passwordResetLimiter, passwordController.validateCode);
router.patch('/cambiarPassword', passwordResetLimiter, passwordController.changePassword);

module.exports = router;
