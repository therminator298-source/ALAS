const express = require('express');

const { asyncHandler } = require('../errors');

function resolveDashboardInteractive(service) {
  if (service) return service;
  return require('../services/dashboardInteractiveService');
}

function createDashboardInteractiveRouter(service) {
  const dashboardInteractive = resolveDashboardInteractive(service);
  const router = express.Router();

  router.get('/summary', asyncHandler(async (req, res) => {
    res.json(await dashboardInteractive.summary(req.query));
  }));

  router.get('/panel/:kpi', asyncHandler(async (req, res) => {
    res.json(await dashboardInteractive.listAcusesByKpi(req.params.kpi, req.query));
  }));

  router.get('/calendar', asyncHandler(async (req, res) => {
    res.json(await dashboardInteractive.calendarMonth(req.query));
  }));

  router.get('/repartidores', asyncHandler(async (req, res) => {
    res.json(await dashboardInteractive.listRepartidores(req.query));
  }));

  router.post('/acuses/:id/print', asyncHandler(async (req, res) => {
    res.status(201).json(await dashboardInteractive.logPrintAction(req.params.id, req.body));
  }));

  return router;
}

module.exports = createDashboardInteractiveRouter;
module.exports.createDashboardInteractiveRouter = createDashboardInteractiveRouter;
