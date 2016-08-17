'use strict';
var router = require('express').Router();
// var Review = require('../../../db/models/review')
module.exports = router;
var db = require("../../../db")
// var Sock = db.model("sock");
var User = db.model("user")

var Review = db.model("review")

router.get('/sock/:id', function(req, res, next) {
  var sockId = req.params.id
  return Review.findAll({
    where:{'sockId': sockId},
    include: [
      {model: User}
    ]
  })
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
  // console.log("BODY", req.body)
  // console.log("USERID", req.session.passport.user)
  // res.sendStatus(200)


  Review.create({
    text: req.body.text,
    userId: req.session.passport.user,
    // userId: req.body.userId,
    sockId: req.body.sockId
  }).then(function(review){
    User.findOne({where: {id: req.session.passport.user}})
    .then(function(user){
      //review.user = user
      res.json({review: review, user: user});
    })
  })
  .catch(next)
})

router.delete('/delete/:reviewId', function(req, res, next) {
  var reviewId = req.params.reviewId;

  Review.findById(reviewId)
  .then(function(review){
    // console.log('ISADMIN', req.user.isAdmin)
    if (req.user === undefined) throw new Error("not authenticated");
    if (req.user.isAdmin) {
      return review.destroy()
      .then(function() {
        return review;
      })
    }
    else throw new Error("not authenticated");
  })
  .then(function(response){
    res.send(response);
  })
  .catch(next);
})
