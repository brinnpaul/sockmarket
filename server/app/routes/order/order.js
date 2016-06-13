'use strict';
var router = require('express').Router();

var db = require("../../../db");
var Sock = db.model("sock");
var Order = db.model('order');
var User = db.model('user')
var OrderDetail = db.model('order_detail');

var splitItemsByOrderId = function(cartHistory) {
  var orderIds = []
  var orderId = null
  cartHistory.forEach(function(item) {
    if(item.orderId !== orderId) {
      var order = {}
      order.orderId = item.orderId
      order.orderDate = item.order.date_paid
      order.items = [item]
      orderIds.push(order)
      orderId = item.orderId
    } else {
      orderIds[orderIds.length-1].items.push(item)
    }
  })
  return orderIds
}

var determineId = function(req) {
  return req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+''} : {userId:req.session.passport.user+''}
}

module.exports = router;
// CLICK ON ADD TO CART
router.post('/', function(req, res, next) {
  //find or create order based on userId or sessionId.
  // this can be changed to find -> need a route to always assure a cart exist -> /createcart
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid:null} : {userId:req.session.passport.user+'', date_paid:null}

  Order.findOrCreate({where:id})
  .then(function(order) {
    req.body.orderId = order[0].id+'';
    return OrderDetail.create(req.body);
  })
  .then(function(newItem) {
    res.json(newItem)
  })
  .catch(next)
})

router.get('/createcart', function(req, res, next) {
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid:null} : {userId:req.session.passport.user+'', date_paid:null}
  Order.findOrCreate({where:id})
  .then(function(order) {
    res.json(order)
  })
  .catch(next)
})

router.get('/current', function(req, res, next) {
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid: null} : {userId:req.session.passport.user+'', date_paid: null};
  console.log("IIIIIIIIIIDDDDDDDD", id)
  Order.findOne({where:id})
  .then(function(order) {
    if (order) return OrderDetail.findAll({where:{orderId:order.id}, include:[{model:Sock}]})
    else return "No Current Orders"
  })
  .then(function(items) {
    // console.log()
    res.json(items)
  })
  .catch(next)
})

router.get('/history', function(req, res, next) {
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid: {$ne:null}} : {userId:req.session.passport.user+'', date_paid: {$ne:null}};
  Order.findAll({where:id})
  .then(function(order) {
    var ids = order.map(function(ord) { return ord.id })
    if (order) {
      return OrderDetail.findAll({where:{orderId:ids}, include:[{model:Sock}, {model:Order}]})
      .then(function(cartHistory) { return splitItemsByOrderId(cartHistory) })
    }
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
  OrderDetail.update({quantity:quant}, {where:{id:itemId}})
  .then(function(item_changed) {
    res.json(item_changed)
  })
  .catch(next)
})

router.delete('/:id', function(req, res, next) {
  var itemId = req.params.id
  OrderDetail.destroy({where:{id:itemId}})
  .then(function(item_removed) {
    res.json(item_removed)
  })
  .catch(next)
})
