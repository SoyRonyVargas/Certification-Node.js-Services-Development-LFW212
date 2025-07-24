var express = require('express');
var router = express.Router();
var model = require('../model');

function checkJsonContentType(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).send('Content-Type must be application/json');
  }
  next();
}

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

router.post('/', checkJsonContentType , function(req, res, next) {
  var id = model.boat.uid();
  model.boat.create(id, req.body.data, (err) => {
    if (err) next(err);
    else res.status(201).send({ id });
  });
});

router.post('/:id/update', function(req, res, next) {
  model.boat.update(req.params.id, req.body.data, (err) => {
    if (err) {
      if (err.message === 'not found') next();
      else next(err);
    } else {
      res.status(204).send();
    }
  });
});

router.put('/:id', function(req, res, next) {
  model.boat.create(req.params.id, req.body.data, (err) => {
    if (err) {
      if (err.message === 'resource exists') {
        model.boat.update(req.params.id, req.body.data, (err) => {
          if (err) next(err);
          else res.status(204).send();
        });
      } else {
        next(err);
      }
    } else {
      res.status(201).send({});
    }
  });
});

router.delete('/:id', function(req, res, next) {
  model.boat.del(req.params.id, (err) => {
    if (err) {
      if (err.message === 'not found') next();
      else next(err);
    } else {
      res.status(204).send();
    }
  });
});

module.exports = router;
