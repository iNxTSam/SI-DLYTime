'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { config } = require('../config/env');
const { badRequest } = require('../utils/httpError');

const uploadsDir = path.resolve(__dirname, '..', '..', config.uploads.dir);

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, ensureUploadsDir());
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // El nombre lo decide el servidor: evita path traversal y nombres
    // predecibles en archivos clinicos.
    cb(null, `${crypto.randomUUID()}.pdf`);
  },
});

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const isPdfMime = file.mimetype === 'application/pdf';
  if (extension !== '.pdf' || !isPdfMime) {
    return cb(badRequest('Solo se permiten archivos PDF.', 'INVALID_FILE_TYPE'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.uploads.maxBytes, files: 1 },
});

/** Middleware listo para procesar un unico PDF en el campo archivoPDF. */
const uploadHistorial = upload.single('archivoPDF');

/** Nombres generados por el propio servidor: UUID + extension. */
const GENERATED_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

/**
 * Borra un archivo subido sin confiar en la ruta que llega del cliente:
 * se reconstruye a partir del directorio de subidas y del nombre generado,
 * que ademas se valida contra un patron estricto.
 */
function removeUploadedFile(file) {
  const name = path.basename(String(file?.filename ?? ''));
  if (!GENERATED_NAME.test(name)) return;
  fs.unlink(path.join(uploadsDir, name), () => {});
}

module.exports = { uploadHistorial, removeUploadedFile, uploadsDir, ensureUploadsDir };
