// Import our Controllers
const impalaController = require('../controllers/impalaController');
const documentation = require('../models/impala');

const route = process.env.ROUTE || 'impala';
const routes = [
  {
    method: 'POST',
    url: `/${route}/v1/rawlist/`,
    handler: impalaController.rawList,
  },
  {
    method: 'POST',
    url: `/${route}/v1/rawupdate/`,
    handler: impalaController.rawUpdate,
  },
  {
    method: 'GET',
    url: `/${route}/v1/schema/:database/:table/`,
    handler: impalaController.schema,
  },
  {
    method: 'GET',
    url: `/${route}/v1/:database/:table/`,
    handler: impalaController.list,
    schema: documentation.schema,
  },
  {
    method: 'GET',
    url: `/${route}/v1/:database/:table/:id`,
    handler: impalaController.show,
    schema: documentation.schema,
  },
  {
    method: 'PUT',
    url: `/${route}/v1/:database/:table/:id`,
    handler: impalaController.update,
  },
  {
    method: 'DELETE',
    url: `/${route}/v1/:database/:table/:id`,
    handler: impalaController.delete,
  },
  {
    method: 'POST',
    url: `/${route}/v1/:database/:table`,
    handler: impalaController.add,
  },
  {
    method: 'POST',
    url: `/${route}/v1/runsamplecmdsync`,
    handler: impalaController.runSampleCmdSync,
  },
  {
    method: 'POST',
    url: `/${route}/v1/runsamplecmdasync`,
    handler: impalaController.runSampleCmdAsync,
  },
  {
    method: 'POST',
    url: `/${route}/v1/runsamplesqlcommand`,
    handler: impalaController.runSampleSQLCommand,
  },
];

module.exports = routes;
