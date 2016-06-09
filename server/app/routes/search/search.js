'use strict';
var router = require('express').Router();

var db = require("../../../db")
var Sock = db.model("sock");
var User = db.model("user")

module.exports = router;

router.get('/', function(req, res, next) {
  var SearchText = req.query.q;
  var SearchTextArr = req.query.q.split(' ');
  console.log(SearchTextArr);
  return Sock.findAll({
  	where: {
  		tags: {
  			$contains: SearchTextArr
  		}
  	}
  })
  .then(function(searchResults) {
    console.log('HERE', searchResults)
    res.json(searchResults)
  })
  .catch(next)
})