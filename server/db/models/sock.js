'use strict';
var Sequelize = require('sequelize');

module.exports = function (db) {
  return db.define('sock', {
    complete: {
      type: Sequelize.BOOLEAN
    },
    title: {
      type: Sequelize.STRING //should this be unique?
    },
    image: {
      type: Sequelize.STRING //url validator CLOB
    },
    description: {
      type: Sequelize.STRING // How to limit char length
    },
    price: {
      type: Sequelize.FLOAT, //cents, INT
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
    classMethods: {
      increasePrice: function(sockId, newPrice){ //instance method? CLOB
        return this.update({price: newPrice},{
          where: {
            id: sockId
          }
        });
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