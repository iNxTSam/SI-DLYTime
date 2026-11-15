'use strict';

const catalogService = require('../services/catalog.service');
const { asyncHandler } = require('../utils/asyncHandler');

const listIdentificationTypes = asyncHandler(async (req, res) => {
  res.json(await catalogService.listIdentificationTypes());
});

const listGenders = asyncHandler(async (req, res) => {
  res.json(await catalogService.listGenders());
});

const listPersonStatuses = asyncHandler(async (req, res) => {
  res.json(await catalogService.listPersonStatuses());
});

module.exports = { listIdentificationTypes, listGenders, listPersonStatuses };
