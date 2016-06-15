'use strict';
var router = require('express').Router();
var stripe = require('stripe')('sk_test_W5MBf7JeibaMyCy26fMDMi8K')
var publickey = 'pk_test_Rd7nMpSZMqRNuB4zjEeZHt1d'

var db = require("../../../db")
var Order = db.model('order')

module.exports = router;

router.post('/checkout', function(req, res, next) {
  var stripeToken = req.body.token
  var amount = parseInt(req.body.amount*100)
  stripe.charges.create({
    card: stripeToken,
    currency: 'usd',
    amount: amount
  },
  function(err, charge) {
    if (err) throw new Error()
    // else res.json(charge)
  })
  .then(function(data) {
    var date = new Date()
    var id = req.user === undefined ? {sessionId:req.session.id} : {userId:req.user.id}
    return Order.update({date_paid: date}, {where:id})
  })
  .then(function(processedOrder) {
    res.json(processedOrder)
  })
  .catch(next)

})
