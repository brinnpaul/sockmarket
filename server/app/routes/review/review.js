'use strict';
var router = require('express').Router();
var Review = require('../../../db/models/review')
module.exports = router;

router.get('/sock/:id', function(req, res, next) {
  var sockId = req.params.id
  return Review.findAll({where:{'sockId': sockId}})
  .then(function(reviews) {
    res.json(reviews)
  })
  .catch(next)
})

router.get('/user/:id', function(req, res, next) {
  var userId = req.params.id
  return Review.findAll({where:{'userId': userId}})
  .then(function(reviews) {
    res.json(reviews)
  })
  .catch(next)
})

router.post('/', function(req, res, next) {
  // You need to make a session id first
})
