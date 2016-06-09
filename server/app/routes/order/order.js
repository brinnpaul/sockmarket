'use strict';
var router = require('express').Router();

var db = require("../../../db")
var Sock = db.model("sock");
var User = db.model("user")
var Order = db.model('order')
var OrderDetail = db.model('order_detail')

module.exports = router;
// CLICK ON ADD TO CART
router.post('/', function(req, res, next) {

  var sessionId = req.session.passport.user+''

  Order.findOrCreate({where:{sessionId:sessionId}})
  .then(function(order) {
    req.body.orderId = order[0].id+''
    return OrderDetail.create(req.body)
    // make sure that req.body has order_detail info on front end
  })
  .then(function(newItem) {
    res.json(newItem)
  })
  .catch(next)
})

// when you log in
// router.put('/')

// add item to your cart

// router.post('/item', function(req, res, next) {
//
// })
