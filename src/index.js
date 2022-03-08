// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: true,
  disableRequestLogging: true,
});

const routes = require('./routes');
const authRoutes = require('./routes/auth');
const impalaController = require('./controllers/impalaController');
// Import Swagger Options
const swagger = require('./config/swagger');
const { logger } = require('./helpers/logging');
// Register Swagger
fastify.register(require('fastify-swagger'), swagger.options);
fastify.register(require('fastify-jwt'), {
  secret: 'Ng8r`xf[WYWwt&{m',
});

fastify.register(require('fastify-multipart'));

const auth = require('./auth');

// Declare a route
fastify.get('/healthz', { logLevel: 'warn' }, async () => (impalaController.healthz()));

authRoutes.forEach((route, index) => {
  fastify.register((instance, opts, next) => {
    instance.route(route);
    next();
  });
});

routes.forEach((route, index) => {
  // fastify.route(route);
  fastify.register((instance, opts, next) => {
    instance.register(auth);
    instance.route(route);

    next();
  });
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(10010, '0.0.0.0');
    fastify.swagger();
    logger.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
start();
