const crypto = require('crypto');
const redis = require('redis');
const { promisify } = require('util');
const { logger } = require('./logging');

const redisServer = process.env.REDIS_SERVER || process.env.REDIS_PORT_6379_TCP_ADDR || 'redis';
const redisPort = process.env.REDIS_PORT_6379_TCP_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || '';
const nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

const cacheTime = process.env.REDIS_CACHE || 12 * 60 * 60; // 12 hours

let client;
if (redisPassword) {
  client = redis.createClient(redisPort, redisServer, { password: redisPassword });
} else {
  client = redis.createClient(redisPort, redisServer);
}

client.on('error', (err) => {
  // handle async errors here
  logger.error(`No Redis available: ${err}`);
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

exports.readCache = async (key) => {
  /*
  if (nodeEnv === 'development') {
    return false;
  }
  */
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  logger.info(hash);
  return getAsync(hash);
};

exports.writeCache = async (key, data) => {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  logger.info(hash);
  logger.info(`Should write: ${data.length}`);
  // return setAsync(hash, cacheTime, JSON.stringify(data));
  // client.set(hash, data, 'EX', cacheTime);
  if (data.length) {
    // client.set(hash, JSON.stringify(data), 'EX', 60);
    return setAsync(hash, JSON.stringify(data), 'EX', cacheTime);
  }
};

exports.invalidateCache = async (key) => {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  logger.info(`Clearing cache for: ${hash}`);
  return delAsync(hash);
};
