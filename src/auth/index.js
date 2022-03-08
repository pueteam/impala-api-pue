const fp = require('fastify-plugin');
const moment = require('moment');
const { logger } = require('../helpers/logging');

function plugin(fastify, options, next) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      const token = await request.jwtVerify();
      logger.info({ url: request.raw.url, id: request.id, user: request.user }, 'received request');
      // logger.info(token);
      const ms = moment().diff(moment(token.iat * 1000));
      if (ms > 7 * 86400 * 1000) {
        logger.error('Token expired');
      }
    } catch (err) {
      reply.send(err);
    }
  });
  fastify.addHook('onResponse', (req, reply, done) => {
    logger.info({ url: req.raw.originalUrl, statusCode: reply.raw.statusCode, responseTime: reply.getResponseTime() }, 'request completed');
    done();
  });
  next();
}
module.exports = fp(plugin, {
  fastify: '3.x',
});
