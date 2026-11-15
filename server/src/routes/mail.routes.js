'use strict';

const express = require('express');
const mailController = require('../controllers/mail.controller');
const { mailLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.post('/enviarCorreoPassword', mailLimiter, mailController.sendPasswordCode);
router.post('/enviarCorreoRegistro', mailLimiter, mailController.sendRegistrationCode);
router.post('/enviar-soporte', mailLimiter, mailController.sendSupport);

module.exports = router;
