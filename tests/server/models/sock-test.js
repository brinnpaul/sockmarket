var sinon = require('sinon');
var expect = require('chai').expect;

var Sequelize = require('sequelize');
// var dbURI = 'postgres://localhost:5432/testing-fsg';
var db = new Sequelize('testing-fsg', 'bpr', 'sunshine', {
    dialect: 'postgres',
    port: 5432,
    logging: false
});

require('../../../server/db/models/user')(db)

var User = db.model('user')
var Sock = db.model('sock')

describe('Sock model', function () {

  beforeEach('Sync DB', function() {
    return db.sync( {force: true })
  })

})
