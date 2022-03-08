const bodyJsonSchema = {
};

const queryStringJsonSchema = {
  type: 'object',
  properties: {
    select: { type: 'string' },
    sort: { type: 'string' },
    order: { type: 'string' },
    offset: { type: 'number' },
    page: { type: 'number' },
    limit: { type: 'number' },
  },
  patternProperties: {
    '^.*_like$': { type: 'string' },
  },
  required: [],
};

const paramsJsonSchema = {
};

const headersJsonSchema = {
};

const securitySchema = [
  {
    apiKey: [],
  },
];

const responseSchema = {
  200: {
    type: 'object',
    properties: {
      docs: { type: 'array', items: { type: 'object', patternProperties: { '^.*$': { type: 'string' } } } },
      totalDocs: { type: 'number' },
      limit: { type: 'number' },
      hasPrevPage: { type: 'boolean' },
      hasNextPage: { type: 'boolean' },
      page: { type: 'number' },
      totalPages: { type: 'number' },
      offset: { type: 'number' },
      prevPage: { type: 'number' },
      nextPage: { type: 'number' },
      pagingCounter: { type: 'number' },
    },
    required: [],
  },
};

const schema = {
  // body: bodyJsonSchema,
  querystring: queryStringJsonSchema,
  params: paramsJsonSchema,
  headers: headersJsonSchema,
  security: securitySchema,
  response: responseSchema,
};

module.exports = {
  schema,
};
