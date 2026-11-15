'use strict';

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_DISABLED = '1';
process.env.JWT_SECRET = 'test-secret-key-with-more-than-32-characters!!';
process.env.DB_NAME = 'dlytime_test';
process.env.UPLOAD_DIR = 'uploads-test';
