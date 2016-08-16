var router = require('express').Router();
module.exports = router;
var db = require("../../db")
var Like = db.model("like");

router.get('/', function(req, res, next) {
  return Like.findAll()
  .then(function(likes) {
    res.json(likes);
  })
  .catch(next);
});

router.get('/sock/:sockId', function(req, res, next) {
  return Like.findAll({where: {sockId: req.params.sockId} })
  .then(function(like) {
    res.json(like)
  })
  .catch(next);
});

router.get('/user/:userId', function(req, res, next) {
  return Like.findAll({where: {userId: req.params.userId} })
  .then(function(like) {
    res.json(like)
  })
  .catch(next);
});

router.post('/like/:sockId', function(req, res, next) {
  var userId = req.user.id;
  var sockId = req.params.sockId;
  return Like.create({
    userId: userId,
    sockId: sockId,
    like: true,
    dislike: false
  })
  .then(function(like) {
    res.json(like)
  })
  .catch(next);
});

router.post('/dislike/:sockId', function(req, res, next) {
  var userId = req.user.id;
  var sockId = req.params.sockId;
  return Like.create({
    userId: userId,
    sockId: sockId,
    like: false,
    dislike: true
  })
  .then(function(like) {
    res.json(like)
  })
  .catch(next);
});

router.put('/dislike/:likeId', function(req, res, next) {
  return Like.findOne({where: {id: req.params.likeId}})
  .then(function(like) {
    return like.update({like: false, dislike: true})
  })
  .then(function(like) {
    res.json(like)
  })
  .catch(next);
});

router.put('/like/:likeId', function(req, res, next) {
  return Like.findOne({where: {id: req.params.likeId}})
  .then(function(like) {
    return like.update({like: true, dislike: false})
  })
  .then(function(like) {
    res.json(like)
  })
  .catch(next);
});
