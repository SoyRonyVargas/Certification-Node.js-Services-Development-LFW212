var express = require('express');
const model = require('../model');
var router = express.Router();

/* GET users listing. */
router.get('/:id', function(req, res, next) {
  model.boat.read(req.params.id, (err, result) => {
    if (err) {
      if (err.message === 'not found') next();
      else next(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
