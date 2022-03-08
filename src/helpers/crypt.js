const bcrypt = require('bcrypt');

exports.cryptPassword = password => new Promise((resolve, reject) => {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { reject(err); } else {
      bcrypt.hash(password, salt, (e, hash) => {
        if (e) {
          return reject(e);
        }
        return resolve(hash);
      });
    }
  });
});

exports.comparePassword = (plainPass, hashword) => new Promise((resolve, reject) => {
  bcrypt.compare(plainPass, hashword, (err, isPasswordMatch) => (err == null
    ? resolve(isPasswordMatch)
    : reject(err)));
});
