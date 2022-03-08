const JDBC = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const process = require('process');
const { logger } = require('./logging');

const dbServer = process.env.DB_HOST || '10.30.65.12:21050';
const dbUser = process.env.DB_USER || 'pueintegration';
const dbPassword = process.env.DB_PASSWORD || 'ienahgah0ec9iGhah9ie';

let impalaInit = false;

if (!jinst.isJvmCreated()) {
  jinst.addOption('-Xrs');
  jinst.addOption('-Dlog4j.configuration=file:./drivers/log4j.properties');
  jinst.setupClasspath(['./drivers/ImpalaJDBC41.jar']);
}

const config = {
  url: `jdbc:impala://${dbServer}/sgpc;AuthMech=3`,
  minpoolsize: 1,
  maxpoolsize: 40,
  maxidle: 1 * 30 * 1000,
  user: dbUser,
  password: dbPassword,
  properties: {},
};


const impaladb = new JDBC(config);

function gracefulShutdown(cb) {
  logger.info('gracefulShutdown');
  impaladb.purge((err) => {
    if (err) return cb(err);
    return cb(null);
  });
}

process.once('SIGUSR2', () => {
  gracefulShutdown(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  gracefulShutdown(() => {
    process.exit();
  });
});

function reserve(db, callback) {
  db.reserve((err, connobj) => {
    if (err) {
      return callback(err);
    }
    return callback(null, connobj, connobj.conn);
  });
}

function release(db, connobj, err, result, callback) {
  db.release(connobj, (e) => {
    if (e) {
      logger.error(e.message);
      return callback(e);
    }
    return callback(null, result);
  });
}

function impaladbInit(callback) {
  if (!impalaInit) {
    impaladb.initialize((err) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }
      impalaInit = true;
      logger.info('initialized DB...');
      return callback(null, impaladb);
    });
  }
  return callback(null, impaladb);
}

function queryDB(type, db, sql, callback) {
  reserve(db, (err, connobj, conn) => {
    if (err) {
      logger.error(err);
    }
    conn.createStatement((errCreate, statement) => {
      if (errCreate) {
        logger.error(errCreate);
        release(db, connobj, errCreate, null, callback);
        return callback(errCreate);
      }
      if (type === 'update') {
        statement.executeUpdate(sql, (errExecute, result) => {
          release(db, connobj, errExecute, result, callback);
          if (errExecute) {
            logger.error(errExecute);
            return callback(errExecute);
          }
          return callback(null, result);
        });
      } else {
        statement.executeQuery(sql, (errExecute, result) => {
          release(db, connobj, errExecute, result, callback);
          if (errExecute) {
            logger.error('ERROR!!!!!!!!!!!!');
            logger.error(errExecute);
            return callback(errExecute);
          }
          logger.debug('NO ERROR!!!!!!!!!!!!');
          return callback(null, result);
        });
      }
    });
  });
}

function getRawSelectQuery(type, query) {
  const payload = {
    type,
    query,
  };
  logger.debug(`Received: ${payload.query}`);
  return new Promise((resolve, reject) => {
    impaladbInit((error) => {
      if (error) {
        logger.error(error);
        reject(error);
      } else {
        queryDB(type, impaladb, query, (err, rs) => {
          if (err) {
            logger.error(err);
            reject(err);
          } else {
            try {
              if (type === 'update') {
                resolve(rs);
              } else {
                // rs.toObjArray((e, results) => resolve(results));
                rs.toObjArray((errToObj, results) => {
                  if (errToObj) {
                    return reject(errToObj);
                  }
                  return resolve(results);
                });
              }
            } catch (e) {
              logger.error(e);
              reject(e);
            }
          }
        });
      }
    });
  });
}

module.exports = {
  getRawSelectQuery,
};
