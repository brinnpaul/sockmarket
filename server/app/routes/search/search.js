'use strict';
var router = require('express').Router();

var db = require("../../../db")
var Sock = db.model("sock");
var User = db.model("user")

module.exports = router;

router.get('/', function(req, res, next) { // put this in the sock router CLOB
  var SearchText = req.query.q;
  var SearchTextArr = req.query.q.split(' ');
  return Sock.findAll({
  	where: {
  		tags: {
  			$contains: SearchTextArr
  		}
  	}
  })
  .then(function(searchResults) {
    res.json(searchResults)
  })
  .catch(next)
})