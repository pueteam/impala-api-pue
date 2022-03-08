// Import our Controllers
const authController = require('../controllers/authController');
const authSeqgenController = require('../controllers/authSeqgenController');
// const documentation = require('../models/impala');

const route = process.env.ROUTE || 'impala';
const routes = [
  {
    method: 'POST',
    url: `/${route}/auth/sign-in`,
    handler: authController.signIn,
    // schema: documentation.schema,
  },
  {
    method: 'POST',
    url: `/${route}/auth/login`,
    handler: authController.login,
  },
  {
    method: 'POST',
    url: `/${route}/auth/sign-out`,
    handler: authSeqgenController.signOut,
  },
  {
    method: 'POST',
    url: `/${route}/auth/sign-up`,
    handler: authController.signUp,
  },
];

module.exports = routes;
