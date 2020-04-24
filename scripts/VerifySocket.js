var jwt = require('jsonwebtoken');
var config = require('../config');
async function verifyToken(token) {
  if (!token)
    return 'error'
  const a = await jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
    return 'error'
    console.log(decoded)
    return decoded
  });
  return a
}

module.exports = verifyToken;