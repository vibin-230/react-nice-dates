var jwt = require('jsonwebtoken');
var config = require('../config');
function verifyToken(req, res, next) {
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    console.log(decoded)
    if(decoded.role){
      req.userId = decoded.id;
      req.username = decoded.username;
      req.role = decoded.role;
    }else{
      req.userId = decoded.id;
      req.phone = decoded.phone;
    }
    next();
  });
}

module.exports = verifyToken;