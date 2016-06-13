'use strict';
var Sequelize = require('sequelize');

module.exports = function (db) {
  return db.define('sock', {
    complete: {
      type: Sequelize.BOOLEAN
    },
    title: {
      type: Sequelize.STRING
    },
    image: {
      type: Sequelize.STRING
    },
    description: {
      type: Sequelize.STRING // How to limit char length
    },
    price: {
      type: Sequelize.FLOAT,
      defaultValue: 4.99
    },
    inventory: {
      type: Sequelize.INTEGER,
      defaultValue: 10
    },
    upvotes: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    downvotes: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    tags: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      set: function (tags) {
        tags = tags || [];
        if (typeof tags === 'string') {
          tags = tags.split(' ').map(function (str) {
            return str.trim();
          });
        }
        this.setDataValue('tags', tags);
      }
    }
  },{
    instanceMethod: {
      changePrice: function(newPrice){
        this.setDataValue('price', 10)
      }
    },
    hooks: {
      beforeCreate: function (sock) {
        sock.title.split(' ').forEach(function(word) {
          sock.tags.push(word)
        })
      }
    }
  }
)}
