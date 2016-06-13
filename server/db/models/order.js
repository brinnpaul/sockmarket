'use strict';

var Sequelize = require('sequelize')
// Sequelize.initVirtualFields()
// var d = require("../../db/")

module.exports = function (db) {
  var OrderDetail = require('./orderDetail')
  var Sock = db.model('sock')
  // db.initVirtualFields()
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
    ,
    order_total: {
      type: Sequelize.VIRTUAL,
      get: function() {
        return OrderDetail.findAll({where:{orderId:this.id}, include: [{model:Sock}]})
        .then(function(order) {
          return order.reduce(function(o, item) {return o + (
            item.sock.price*item.quantity)}, 0)
        })
      }
    }
  }, {
    getterMethods: {
      total: function() {
        return OrderDetail.findAll({where:{orderId:this.id}, include: [{model:Sock}]})
        .then(function(order) {
          return order.reduce(function(o, item) {return o + (
            item.sock.price*item.quantity)}, 0)
        })
      }
    },
    classMethods: {
      updateCartOnLogin: function(uId, sId) {
        return this.findOne({where: {userId: uId, date_paid: null}})
        .then(function(previous) {
          if (previous) {
            this.findOne({where: {sessionId: sId, date_paid: null}})
            .then(function(current) {
              this.update({sessionId:null}, {where:{id: previous.id}})
              return OrderDetail.update({orderId: previous.id}, {where:{orderId: current.id}})
            })
          } else {
            return this.update({userId: uId, sessionId:null}, {where: {sessionId: sId, date_paid:null}})
          }
        })
      }
    }
  })
}
