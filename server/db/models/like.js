var Sequelize = require('sequelize')
// Sequelize.initVirtualFields()
// var d = require("../../db/")

module.exports = function (db) {

  // db.initVirtualFields()
  return db.define('like', {
    like: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
    dislike: {
      type:Sequelize.BOOLEAN,
      allowNull: false
    }
  })

}