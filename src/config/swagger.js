exports.options = {
  routePrefix: '/impala/documentation',
  exposeRoute: true,
  swagger: {
    info: {
      title: 'Impala API',
      description: 'Impala API connector',
      version: '1.0.0',
      license: { name: 'Apache 2.0', url: 'http://www.apache.org/licenses/LICENSE-2.0.html' },
    },
    contact: {
      name: 'PUE Team',
      url: 'https://www.pue.es',
      email: 'sergio@pue.es',
    },
    externalDocs: {
      url: 'https://www.pue.es',
      description: 'Find more info here',
    },
    // host: 'localhost:3000',
    schemes: ['https', 'http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      apiKey: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
      },
    },
  },
};

