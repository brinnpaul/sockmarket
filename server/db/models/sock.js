'use strict';
var crypto = require('crypto');
var _ = require('lodash');
var Sequelize = require('sequelize');

module.exports = function (db) {
  db.define('sock', {
    complete: {
      type: Sequelize.BOOLEAN
    },
    tags: {
      type: Sequelize.ARRAY // define values allowed in array
    },
    description: {
      type: Sequelize.STRING // How to limit char length
    },
    price: {
      type: Sequelize.FLOAT,
      defaultValue: 4.99
    }
  }, {})
}
