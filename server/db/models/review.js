'use strict';
var crypto = require('crypto'); // why?
var _ = require('lodash'); // why?
var Sequelize = require('sequelize');

module.exports = function (db) {
  return db.define('review', {
    date: { //createdAt default CLOB
      type: Sequelize.DATE
    },
    text: {
      type: Sequelize.STRING(2000)
    }
  })
}
