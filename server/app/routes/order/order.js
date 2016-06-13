'use strict';
var router = require('express').Router();

var db = require("../../../db");
var Sock = db.model("sock");
var Order = db.model('order');
var User = db.model('user')
var OrderDetail = db.model('order_detail');

var splitItemsByOrderId = function(cartHistory) { //should this be an instance method?
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

module.exports = router;
// CLICK ON ADD TO CART
router.post('/', function(req, res, next) { // is this route for just orders? or just cart? CLOB
  //find or create order based on userId or sessionId.
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+''} : {userId:req.session.passport.user+''} //req.user... to string? CLOB

  Order.findOrCreate({where:id}) // this should be cart middleware? CLOB
  .then(function(order) {
    req.body.orderId = order[0].id+'';
    console.log("BODYyyy", req.body);
    return OrderDetail.create(req.body);
  })
  .then(function(newItem) {
    res.json(newItem)
  })
  .catch(next)
})

router.get('/current', function(req, res, next) {
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid: null} : {userId:req.session.passport.user+'', date_paid: null}; // repetitive CLOB
  Order.findOne({where:id})
  .then(function(order) {
    if (order) return OrderDetail.findAll({where:{orderId:order.id}, include:[{model:Sock}]})
    else return "No Current Orders" //returning a string for no results? maybe {} CLOB
  })
  .then(function(items) {
    res.json(items)
  })
  .catch(next)
})

router.get('/history', function(req, res, next) {
  var id = req.session.passport.user+'' === 'undefined' ? {sessionId:req.session.id+'', date_paid: {$ne:null}} : {userId:req.session.passport.user+'', date_paid: {$ne:null}};
  Order.findAll({where:id})
  .then(function(order) { 
    var ids = order.map(function(ord) { return ord.id })
    if (order) { // [] === true CLOB
      return OrderDetail.findAll({where:{orderId:ids}, include:[{model:Sock}, {model:Order}]})
      .then(function(cartHistory) { return splitItemsByOrderId(cartHistory) }) //make linear CLOB
    }
    else return "No Order History" //maybe return [] ? CLOB
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
