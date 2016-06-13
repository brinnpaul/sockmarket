'use strict';

var Sequelize = require('sequelize')
// var d = require("../../db/")

module.exports = function (db) {
  var OrderDetail = require('./orderDetail')(db) // redefines the model db.model('order_detail') CLOB
  return db.define('order', {
    date_shipped: {
      type: Sequelize.DATE
    },
    date_paid: {
      type: Sequelize.DATE
    },
    sessionId: {
      type: Sequelize.STRING
    }
  }, {
    classMethods: {
      updateCartOnLogin: function(uId, sId) {
        return this.findOne({where: {userId: uId, date_paid: null}})
        .then(function(previous) {
          if (previous) {
            this.findOne({where: {sessionId: sId, date_paid: null}}) // nested .then... this one is not returned CLOB
            .then(function(current) {
              this.update({sessionId:null}, {where:{id: previous.id}}) // async & can use previous CLOB
              return OrderDetail.update({orderId: previous.id}, {where:{orderId: current.id}})
            })
          } else {
            return this.update({userId: uId}, {where: {sessionId: sId, date_paid:null}})
          }
        })
      }
    }
  })
}
