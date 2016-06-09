'use strict';

var Sequelize = require('sequelize');

module.exports = function (db) {
  return db.define('order_detail', {
    quantity: {
      type: Sequelize.INTEGER
    }
  })
}
