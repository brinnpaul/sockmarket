'use strict';

var db = require('./_db');
// var User = require('./models/user.js')
// var Sock = require('./models/sock.js')
// var Review = require('./models/review.js')


var User = require('./models/user')(db);
var Sock = require('./models/sock')(db)
var Review = require('./models/review')(db)
var Order = require('./models/order')(db)
var OrderDetail = require('./models/orderDetail')(db)
var Like = require('./models/like')(db)

Sock.belongsTo(User)
Sock.hasMany(Review)
Review.belongsTo(User)
Review.belongsTo(Sock)
Order.belongsTo(User, {foreignKey: {allowNull: true}})
Order.hasMany(OrderDetail)
OrderDetail.belongsTo(Order)
OrderDetail.belongsTo(Sock)
Sock.hasMany(Like)
User.hasMany(Like)

module.exports = db;
