// External Dependancies
const boom = require('boom');
const { spawnSync } = require('child_process');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

const ImpalaJDBC = require('../helpers/impalajdbc');
const cache = require('../helpers/cache');
const crypt = require('../helpers/crypt');
const { logger } = require('../helpers/logging');

const db = new ImpalaJDBC();
db.init().catch((e) => { logger.error(e); process.exit(1); });

process.on('uncaughtException', (err) => {
  logger.error('There was an uncaught error', err);
  process.exit(1);
});

process.once('SIGUSR2', () => {
  db.gracefulShutdown(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  db.gracefulShutdown(() => {
    process.exit();
  });
});

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
}

function paginate(array, options) {
  if (!options || (!options.page && !options.limit)) {
    return array;
  }
  let { page } = options;
  const { limit } = options;
  page -= 1; // because pages logically start with 1, but technically with 0
  return array.slice(page * limit, (page + 1) * limit);
}

function selectFields(array, options) {
  if (!options || !options.select) {
    return array;
  }
  const { select } = options;
  const properties = select.split(',');
  // const result = array.map(({id,name,billingcountry}) => (properties));
  const result = array.map((element) => {
    const tmpResult = {};
    properties.forEach((el) => {
      tmpResult[el] = element[el];
    });
    return tmpResult;
  });
  return result;
}

function sortArray(array, options) {
  if (!options || !options.sort) {
    return array;
  }

  if (options.order === 'DESC') {
    // eslint-disable-next-line no-nested-ternary
    return array.sort((a, b) => ((a[options.sort] > b[options.sort]) ? -1 : ((b[options.sort] > a[options.sort]) ? 1 : 0)));
  }
  // eslint-disable-next-line no-nested-ternary
  return array.sort((a, b) => ((a[options.sort] > b[options.sort]) ? 1 : ((b[options.sort] > a[options.sort]) ? -1 : 0)));
}
function countDecimals(value) {
  if (Math.floor(value) !== value) return value.toString().split('.')[1].length || 0;
  return 0;
}

function searchData(array, options) {
  let result = array;
  // eslint-disable-next-line no-restricted-syntax
  for (const key in options) {
    if (/_like$/.test(key)) {
      // options[key]
      const re = new RegExp(options[key], 'ig');
      const searchKey = key.split('_like')[0];
      const filtered = result.filter((item) => re.test(item[searchKey]));
      result = filtered;
    }
  }
  return result;
}

function queryImpala(database, query, options, disableCache) {
  const useCache = !disableCache;
  return new Promise((resolve, reject) => {
    cache.readCache(query)
      .then((result) => {
        if (result && useCache) {
          logger.info('CACHE HIT');
          logger.info(`got: ${JSON.parse(result).length}`);
          let tmp = JSON.parse(result);
          tmp = sortArray(tmp, options);
          tmp = searchData(tmp, options);
          const totalDocs = tmp.length;
          tmp = paginate(tmp, options);
          tmp = selectFields(tmp, options);
          const limit = (options && options.limit) ? options.limit : totalDocs;
          resolve({ docs: tmp, totalDocs, limit });
        } else {
          logger.info('CACHE MISS');
          db.getRawSelectQuery(database, query)
            .then((qr) => {
              cache.writeCache(query, qr);
              let tmp = qr;
              tmp = sortArray(tmp, options);
              tmp = searchData(tmp, options);
              const totalDocs = tmp.length;
              tmp = paginate(tmp, options);
              tmp = selectFields(tmp, options);
              const limit = (options && options.limit) ? options.limit : totalDocs;
              resolve({ docs: tmp, totalDocs, limit });
            })
            .catch((err) => reject(err));
        }
      })
      .catch((error) => reject(error));
  });
}

// Get all items
exports.schema = async (req) => {
  const { table, database } = req.params;
  logger.info(`Params: ${JSON.stringify(req.query)}`);
  logger.info(`User: ${JSON.stringify(req.user)}`);
  const query = `DESCRIBE ${database}.${table}`;
  return queryImpala('select', query, req.query);
};

// Get all items
exports.list = async (req) => {
  const { table, database } = req.params;
  logger.info(`Params: ${JSON.stringify(req.query)}`);
  logger.info(`User: ${JSON.stringify(req.user)}`);
  const query = `SELECT * FROM ${database}.${table}`;
  return queryImpala('select', query, req.query);
};

// Get single item by ID
exports.show = async (req) => {
  const { table, database, id } = req.params;
  const query = `SELECT * FROM ${database}.${table} WHERE id='${id}'`;
  return queryImpala('select', query);
};

function addBuildQuery(params) {
  const p = params;
  let queryCols = '(';
  let queryValues = ' values (';
  Object.entries(p).forEach((entry) => {
    const key = entry[0];
    const value = entry[1];
    queryCols += `\`${key}\`,`;
    if ((typeof value === 'number' || typeof value === 'boolean') && key !== 'id') {
      queryValues += `${value},`;
    } else {
      queryValues += `'${value}',`;
    }
  });
  queryValues = queryValues.replace(/,\s*$/, '');
  queryValues = `${queryValues});`;
  queryCols = queryCols.replace(/,\s*$/, '');
  queryCols = `${queryCols})`;
  logger.info(queryValues);
  return `${queryCols} ${queryValues}`;
}

// Add a new item
exports.add = async (req) => {
  try {
    const { table, database } = req.params;
    const payload = req.body;
    if (payload.password) {
      payload.password = await crypt.cryptPassword(payload.password);
    }
    let query = addBuildQuery(payload);
    query = `INSERT INTO ${database}.${table} ${query}`;
    const invalidate = `SELECT * FROM ${database}.${table}`;
    const res = await cache.invalidateCache(invalidate);
    logger.info(`Invalidated: ${res}`);
    return db.getRawSelectQuery('update', query);
  } catch (err) {
    throw boom.boomify(err);
  }
};

function updateBuildQuery(params) {
  // UPDATE users SET name = 'Test testito' WHERE email = 'test@test.com';
  const p = params;
  let query = `WHERE ${Object.keys(p)[0]} = '${params[Object.keys(p)[0]]}'`;
  delete p[Object.keys(p)[0]];
  logger.info(`current params: ${JSON.stringify(p)}`);
  let tmpQuery = '';
  Object.entries(p).forEach((entry) => {
    const key = entry[0];
    const value = entry[1];
    if ((typeof value === 'number' || typeof value === 'boolean') && key !== 'id') {
      tmpQuery += `${key} = ${value},`;
    } else {
      tmpQuery += `${key} = '${value}',`;
    }
  });
  tmpQuery = tmpQuery.replace(/,\s*$/, '');
  query = `${tmpQuery} ${query}`;
  logger.info(query);
  return query;
}

// Update an existing item
exports.update = async (req) => {
  try {
    const { table, database } = req.params;
    // const item = req.body;
    // const { ...updateData } = item;
    const payload = req.body;
    logger.info(payload);
    if (payload.password && payload.password.length < 20) {
      payload.password = await crypt.cryptPassword(payload.password);
    }
    let query = updateBuildQuery(req.body);
    query = `UPDATE ${database}.${table} SET ${query}`;
    const invalidate = `SELECT * FROM ${database}.${table}`;
    const res = await cache.invalidateCache(invalidate);
    logger.info(`Invalidated: ${res}`);
    return db.getRawSelectQuery('update', query);
  } catch (err) {
    throw boom.boomify(err);
  }
};

// Delete a item
exports.delete = async (req) => {
  try {
    const { table, database, id } = req.params;
    const { key } = req.query;

    const query = `DELETE FROM ${database}.${table} WHERE ${key} = '${id}'`;
    const invalidate = `SELECT * FROM ${database}.${table}`;
    const res = await cache.invalidateCache(invalidate);
    logger.info(`Invalidated: ${res}`);
    return db.getRawSelectQuery('update', query);
  } catch (err) {
    throw boom.boomify(err);
  }
};

exports.healthz = async () => db.getRawSelectQuery('select', 'select 1');

// Get all items from raw query
exports.rawList = async (req) => {
  const payload = req.body;
  logger.info(`Params: ${JSON.stringify(payload)}`);
  const { query } = payload;
  return db.getRawSelectQuery('select', query);
};

// Execute raw query (update or insert)
exports.rawUpdate = async (req) => {
  const payload = req.body;
  logger.info(`Params: ${JSON.stringify(payload)}`);
  const { query } = payload;
  return db.getRawSelectQuery('update', query);
};

exports.runSampleSQLCommand = async (req) => {
  const payload = req.body;
  logger.info(`Params: ${JSON.stringify(req.query)}`);
  logger.info(`Params: ${JSON.stringify(payload)}`);
  const query = `SELECT *
  FROM default.customers`;
  return queryImpala('select', query, req.query, false);
};

exports.runSampleCmdSync = async (req, reply) => {
  const payload = req.body;
  logger.info(payload);
  const argsOneLiner = 'ls /';
  const cmd = await exec(argsOneLiner);
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ stdout: cmd.stdout.trim(), stderr: cmd.stderr.trim() });
};

exports.runSampleCmdAsync = async (req, reply) => {
  const payload = req.body;
  logger.info(payload);
  const argsOneLiner = 'ls /';
  const child = spawn(argsOneLiner, { shell: true, stdio: 'pipe' });
  child.stderr.on('data', (output) => {
    logger.error(`child stderr:\n${output}`);
  });
  child.stdout.on('data', (stdout) => {
    logger.debug(stdout.toString());
  });
  child.on('exit', (status, signal) => {
    logger.debug(`Status: ${status}`);
    logger.debug(`Signal: ${signal}`);
    if (status !== 0) {
      logger.error(`Error: ${status}`);
    }
  });
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ message: 'Started' });
};
