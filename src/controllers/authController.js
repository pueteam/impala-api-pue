// External Dependancies
const { logger } = require('../helpers/logging');

const jdbc = require('../helpers/jdbc');
const crypt = require('../helpers/crypt');

exports.login = async (req, reply) => {
  const query = `SELECT * FROM sgpc.users_seqgen WHERE email = '${req.body.email}';`;
  const qr = await jdbc.getRawSelectQuery('select', query);
  const checkPass = await crypt.comparePassword(req.body.password, qr[0].password);
  req.log.info(`qr: ${JSON.stringify(qr)}`);
  if (!qr.length || !checkPass) {
    return reply
      .code(401)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({ error: 'Unkown user or wrong password' });
  }
  const payload = qr[0];
  const token = await reply.jwtSign({
    name: payload.name, email: payload.email, role: payload.role, channel: payload.channel,
  }, { expiresIn: '7d' });
  return {
    token, name: payload.name, email: payload.email, role: payload.role, channel: payload.channel,
  };
};

exports.signIn = async (req, reply) => {
  const query = `SELECT * FROM sgpc.users WHERE email = '${req.body.email}';`;
  const qr = await jdbc.getRawSelectQuery('select', query);
  const checkPass = await crypt.comparePassword(req.body.password, qr[0].password);
  req.log.info(`qr: ${JSON.stringify(qr)}`);
  if (!qr.length || !checkPass) {
    return reply
      .code(401)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({ error: 'Unkown user or wrong password' });
  }
  const payload = qr[0];
  const token = await reply.jwtSign({
    name: payload.name, email: payload.email, role: payload.role, channel: payload.channel,
  }, { expiresIn: '7d' });
  return {
    token, name: payload.name, email: payload.email, role: payload.role, channel: payload.channel,
  };
};

exports.signOut = async (req, reply) => {
  req.log.info(req.body);
  return { message: 'ok' };
};

exports.signUp = async (req, reply) => {
  // some code
  req.log.info(req.body);
  const payload = req.body;
  const crypted = await crypt.cryptPassword(payload.password);
  const query = `INSERT INTO sgpc.users values ('${payload.email}', '${payload.fullName}', '${crypted}', 'guest', '');`;
  const qr = await jdbc.getRawSelectQuery('update', query);
  req.log.info(`qr: ${qr}`);
  const token = await reply.jwtSign({
    name: payload.fullName, email: payload.email, role: 'guest', channel: '',
  }, { expiresIn: '7d' });
  return {
    token, name: payload.fullName, email: payload.email, role: 'admin',
  };
};
