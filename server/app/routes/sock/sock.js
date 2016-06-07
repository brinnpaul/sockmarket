'use strict';
var router = require('express').Router();
var Sock = require('../../../db/models/sock')
module.exports = router;

router.get('/:id', function(req, res, next) {
  var sockId = req.params.id
  return Sock.findById(sockId)
  .then(function(sock) {
    res.json(sock)
  })
  .catch(next)
})
