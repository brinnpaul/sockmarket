'use strict';

var Sequelize = require('sequelize');

module.exports = function (db) {
  var Order = db.define('order', {
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
      allOrders: function() {
        return Order.findAll()
      }
    }
  })
  return Order
}
