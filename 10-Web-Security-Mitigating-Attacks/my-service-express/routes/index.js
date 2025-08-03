var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  const reqSocket= req.socket.ip

  res.json({
    ip: req.ip,
    ipSocket: reqSocket || req.socket.remoteAddress,
    view: 'index',
  })

});

module.exports = router;
