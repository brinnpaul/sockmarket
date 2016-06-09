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

Sock.belongsTo(User)
Review.belongsTo(User)
Review.belongsTo(Sock)
Order.belongsTo(User, {foreignKey: {allowNull: true}})
OrderDetail.belongsTo(Order)
OrderDetail.belongsTo(Sock)

module.exports = db;
