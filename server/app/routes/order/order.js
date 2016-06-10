'use strict';
var router = require('express').Router();

var db = require("../../../db")
var Sock = db.model("sock")
var User = db.model("user")
var Order = db.model('order')
var OrderDetail = db.model('order_detail')

module.exports = router
// CLICK ON ADD TO CART
router.post('/', function(req, res, next) {
  //find or create order based on userId or sessionId.
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+''} : {userId:req.session.passport.user+''}

  Order.findOrCreate({where:id})
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

router.get('/current', function(req, res, next) {
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid: null} : {userId:req.session.passport.user+'', date_paid: null};
  // temp variable for postman
  // var id = 2
  console.log("IDDDDD", id)
  Order.findOne({where:id})
  .then(function(order) {
    console.log("ORDER", order)
    if (order) return OrderDetail.findAll({where:{orderId:order.id}, include:[{model:Sock}]})
    else return "No Current Orders"
  })
  .then(function(items) {
    res.json(items)
  })
  .catch(next)
})

router.get('/history', function(req, res, next) {
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid: {$ne:null}} : {userId:req.session.passport.user+'', date_paid: {$ne:null}};
  // temp variable for postman
  // var id = 2
  Order.findOne({where:id})
  .then(function(order) {
    console.log(order)
    if (order) return OrderDetail.findAll({where:{orderId:order.id}})
    else return "No Order History"
  })
  .then(function(items) {
    res.json(items)
  })
  .catch(next)
})


router.put('/', function(req, res, next) {
  var itemId = req.body.id
  var quant= req.body.quantity
console.log(req.body, "itemid", itemId, "quant : ", quant)
  OrderDetail.update({quantity:quant}, {where:{id:itemId}})
  .then(function(item_changed) {
    res.json(item_changed)
  })
  .catch(next)
})

router.delete('/:id', function(req, res, next) {
  var itemId = req.params.id
  console.log("DELETEING", req.params.id)

  OrderDetail.destroy({where:{id:itemId}})
  .then(function(item_removed) {
    res.json(item_removed)
  })
  .catch(next)
})
