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

router.post('/delete/:id', function (req, res, next) {
  var id = req.params.id;

  Sock.findById(id)
  .then(function(sock){
    // console.log('ISADMIN', req.user.isAdmin)
    if (sock.UserId == req.user.id || req.user.isAdmin) return sock.destroy()
    else throw error
  })
  .then(function(response){
    res.send(response);
  })
  .catch(next);
});


router.post('/', function(req, res, next) {
  req.body.userId = req.user.id;
  req.body.tags.push(req.user.first_name);
  req.body.tags.push(req.user.last_name);
  User.findOne({
    where: {
      id: req.user.id
    }
  })
  .then(function (result) {
    console.log('FIRST SAVE RESULT', result)
    return Sock.create(req.body)
   })
  .then(function (newSock) {
    res.json(newSock);
  })
  .catch(next);
})




