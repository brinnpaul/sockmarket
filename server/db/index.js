'use strict';

var db = require('./_db');
// var User = require('./models/user.js')
// var Sock = require('./models/sock.js')
// var Review = require('./models/review.js')

module.exports = db;

var User = require('./models/user')(db);
var Sock = require('./models/sock')(db)
var Review = require('./models/review')(db)

Sock.belongsTo(User)
Review.belongsTo(User)
Review.belongsTo(Sock)
