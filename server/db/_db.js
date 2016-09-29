var path = require('path');
var Sequelize = require('sequelize');

var env = require(path.join(__dirname, '../env'));

 var db = new Sequelize(env.DATABASE_URI);

// var db = new Sequelize('fsg', 'bpr', 'sunshine', {
// dialect: 'postgres',
// port: 5432
// })

//var db = new Sequelize('fsg', 'ani', 'sunshine', {
//  dialect: 'postgres',
//  port: 5432
//})

module.exports = db;
