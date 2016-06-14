'use strict';
var router = require('express').Router();
var Sequelize = require('sequelize');

var db = require("../../../db");
var Sock = db.model("sock");
var User = db.model("user");
var AWS = require('aws-sdk');
var Credentials = require('../../../env/production');

AWS.config.region = 'us-east-1';
AWS.config.credentials = Credentials.AWS

var s3bucket = new AWS.S3({params: {Bucket: 'sockmarket'}});


module.exports = router;

router.get('/unsignedURL', function(req, res, next){

  function generateFileName() {
    var key = "1234567890QWERTYUIOPASDFGHJKLZXCVBNM123456789qwertyuiopasdfghjklzxcvbnm";
    var output = '';

    for (var i = 0; i < 25; i++) {
      var random = Math.random() * key.length - 1;
      var atIndex = Math.floor(random) + 1;
      output += key[atIndex];
    }
    return output;
  }

  var params = {Bucket: 'sockmarket/socks', Key: generateFileName()+".png", ACL: "public-read", ContentType:'image/png'};
  s3bucket.getSignedUrl('putObject', params, function (err, url) {
    res.json({url: url});
  });
})


router.get('/recent', function(req, res, next) {
  return Sock.findAll({
    limit: 10,
    order: [
      ['updatedAt', 'DESC']
    ]
    }
  )
  .then(function(sock) {
    res.json(sock)
  })
  .catch(next)
})

router.get('/:id', function(req, res, next) {
  var sockId = req.params.id
  return Sock.findById(sockId,
    {include: [
      { model: User }
    ]}
  )
  .then(function(sock) {
    res.json(sock)
  })
  .catch(next)
})

router.get('/byUser/:id', function(req, res, next) {
  return Sock.findAll({ where: {
    userId: req.params.id
  }
  })
  .then(function(sock) {
    res.json(sock)
  })
  .catch(next)
})

router.post('/upvote', function (req, res, next) {
  return Sock.update(
    {upvotes: Sequelize.literal('upvotes +1')},
    {
    where: {
      id: req.body.id
    }
  })
  .then(function(result) {
    res.send(result)
  })
})

router.post('/downvote', function (req, res, next) {
  return Sock.update(
    {downvotes: Sequelize.literal('downvotes +1')},
    {
    where: {
      id: req.body.id
    }
  })
  .then(function(result) {
    res.send(result)
  })
})


router.post('/', function(req, res, next) {

  req.body.userId = req.user.id;
  console.log("req bodey for the sock creation", req.body);
  Sock.create(req.body)
  .then(function(newSock) {
    res.json(newSock);
  })
  .catch(next);

})




