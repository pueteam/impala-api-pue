const JDBC = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const process = require('process');
const { logger } = require('./logging');

const dbServer = process.env.DB_HOST || '10.30.65.6:21050';
const dbUser = process.env.DB_USER || 'pueintegration';
const dbPassword = process.env.DB_PASSWORD || 'testpassword';

if (!jinst.isJvmCreated()) {
  jinst.addOption('-Xrs');
  jinst.setupClasspath(['./drivers/ImpalaJDBC41.jar']);
}

const config = {
  url: `jdbc:impala://${dbServer}/sgpc;AuthMech=3`,
  minpoolsize: process.env.MINPOOLSIZE || 1,
  maxpoolsize: process.env.MAXPOOLSIZE || 20,
  maxidle: 50 * 60 * 1000,
  user: dbUser,
  password: dbPassword,
  properties: {},
};

function reserve(db) {
  return new Promise((resolve, reject) => {
    db.reserve((err, connobj) => {
      if (err) {
        logger.error('ERROR RESERVING!!!');
        return reject(err);
      }
      return resolve(connobj);
    });
  });
}

function release(db, connobj) {
  return new Promise((resolve, reject) => {
    db.release(connobj, (e) => {
      if (e) {
        logger.error(e.message);
        return reject(e);
      }
      return resolve();
    });
  });
}

function createStatement(conn) {
  return new Promise((resolve, reject) => {
    conn.createStatement((err, statement) => {
      if (err) {
        return reject(err);
      }
      return resolve(statement);
    });
  });
}

function executeUpdate(statement, sql) {
  return new Promise((resolve, reject) => {
    statement.executeUpdate(sql, async (errExecute, result) => {
      if (errExecute) {
        logger.error(errExecute.msg);
        return reject(errExecute);
      }
      return resolve(result);
    });
  });
}

function executeQuery(statement, sql) {
  return new Promise((resolve, reject) => {
    statement.executeQuery(sql, async (errExecute, result) => {
      if (errExecute) {
        logger.error(errExecute);
        return reject(errExecute);
      }
      return resolve(result);
    });
  });
}

function queryDB(type, db, sql) {
  let result;
  return new Promise(async (resolve, reject) => {
    // logger.info('RESERVANDO');
    // logger.info(db._pool.length);
    // logger.info(db._reserved.length);
    const connobj = await reserve(db).catch(e => reject(e));
    const { conn } = connobj;
    const statement = await createStatement(conn).catch(e => reject(e));
    if (type === 'update') {
      result = await executeUpdate(statement, sql).catch(e => reject(e));
      await release(db, connobj);
      return resolve(result);
    }
    result = await executeQuery(statement, sql).catch(e => reject(e));
    await release(db, connobj);
    return resolve(result);
  });
}

class ImpalaJDBC {
  constructor() {
    this.impaladb = new JDBC(config);
  }

  init() {
    return new Promise((resolve, reject) => {
      this.impaladb.initialize((err) => {
        if (err) {
          logger.error(err);
          return reject(err);
        }
        logger.info('initialized DB...');
        return resolve();
      });
    });
  }

  getRawSelectQuery(type, query) {
    const payload = {
      type,
      query,
    };
    if (payload.query !== 'select 1') {
      logger.debug(`Received: ${payload.query}`);
    }
    return new Promise(async (resolve, reject) => {
      const rs = await queryDB(type, this.impaladb, query).catch(e => reject(e));
      if (type === 'update') {
        resolve(rs);
      } else {
        if (!rs) {
          logger.error(`Invalid RS for query: ${query} - Pool exhausted?`);
        }
        try {
          rs.toObjArray((errToObj, results) => {
            if (errToObj) {
              return reject(errToObj);
            }
            return resolve(results);
          });
        } catch (e) {
          return reject(e);
        }
      }
    });
  }

  gracefulShutdown() {
    logger.info('gracefulShutdown');
    return new Promise((resolve, reject) => {
      this.impaladb.purge((err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }
}

module.exports = ImpalaJDBC;
