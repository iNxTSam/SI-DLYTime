'use strict';

const express = require('express');
const authController = require('../controllers/auth.controller');
const mailService = require('../services/mail.service');
const { loginLimiter, mailLimiter } = require('../middlewares/rateLimit');
const { asyncHandler } = require('../utils/asyncHandler');
const { asEmail } = require('../utils/validate');

const router = express.Router();

router.post('/registro', authController.register);
router.post('/login', loginLimiter, authController.login);

// Verificacion del codigo de registro en el servidor (antes se comparaba en
// el navegador contra localStorage).
router.post(
  '/verificarCodigo',
  mailLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const correo = asEmail(body.correo, 'correo');
    mailService.verifyRegistrationCode(correo, String(body.codigo ?? '').trim());
    res.status(200).json({ valid: true });
  })
);

module.exports = router;
