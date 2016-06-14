'use strict';
var router = require('express').Router();
var stripe = require('stripe')('sk_test_W5MBf7JeibaMyCy26fMDMi8K')
var publickey = 'pk_test_Rd7nMpSZMqRNuB4zjEeZHt1d'

var db = require("../../../db")

module.exports = router;

router.post('/charge', function(req, res, next) {
  // var stripeToken = req.body.stripeToken
  // var amount = 10
  res.json(req.body)
  // console.log("STRIPETOKEN", stripeToken)
  // stripe.charges.create({
  //   card: stripeToken,
  //   currency: 'usd',
  //   amount: amount
  // },
  // function(err, charge) {
  //   console.log("IVE BEEN HIT")
  //   if (err) res.send(500, err)
  //   else res.send(204)
  // })
  // .catch(next)

})
