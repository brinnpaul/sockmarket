'use strict';

var Sequelize = require('sequelize');

module.exports = function (db) {
  var OrderDetail = db.define('order_detail', {
    quantity: {
      type: Sequelize.INTEGER
    }
  })
  return OrderDetail
}

// Order.findOne({where:{userId:user.id, paid_date: null}})
// .then(function(previous) {
//   if(previous) {
//     Order.findOne({where: {sessionId: sessionId, paid_date: null}})
//     .then(function(current){
//       OrderDetail.updateAttribute({orderId:current.id}, {where:{orderId:previous.id}})
//     })
//   }else {
//     Order.update({userId: user.id}, {where: {sessionId: sessionId, paid_date: null}})
//   }
// })
// .catch(done)
