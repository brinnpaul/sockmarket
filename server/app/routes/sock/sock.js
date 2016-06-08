'use strict';
var router = require('express').Router();

var db = require("../../../db")
var Sock = db.model("sock");
var User = db.model("user")

module.exports = router;

router.get('/:id', function(req, res, next) {
  var sockId = req.params.id
  return Sock.findById(sockId
    ,
    {include: [
      { model: User }
    ]}
  )
  .then(function(sock) {
    res.json(sock)
  })
  .catch(next)
})

router.post('/', function(req, res, next) {
  Sock.create(req.body)
  .then(function(newSock) {
    res.json(newSock);
  })
  .catch(next);
})
