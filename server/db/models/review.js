'use strict';
var crypto = require('crypto');
var _ = require('lodash');
var Sequelize = require('sequelize');

module.exports = function (db) {
  return db.define('review', {
    date: {
      type: Sequelize.DATE
    },
    text: {
      type: Sequelize.STRING(2000)
    }
  })
}
