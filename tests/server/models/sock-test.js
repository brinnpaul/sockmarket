
var expect = require('chai').expect;

var Sequelize = require('sequelize');
// var dbURI = 'postgres://localhost:5432/testing-fsg';
var db = new Sequelize('testing-fsg', 'bpr', 'sunshine', {
    dialect: 'postgres',
    port: 5432,
    logging: false
});

require('../../../server/db/models/sock')(db)

var Sock = db.model('sock')

describe('Sock model', function () {

  beforeEach('Sync DB', function() {
    return db.sync( {force: true } )
  })

  describe('on creation', function () {

    it('should add title to the tags of the sock', function (done) {
        Sock.create({
          complete: true,
          title: 'Amazing Blue',
          image: 'http://placehold.it/150x150',
          description: 'Socks, more amazing than before'
        })
        .then(function () {
          return Sock.findOne({where:{title: 'Amazing Sock'}})
        })
        .then(function(sock) {
          expect(sock.tags===sock.title.split(' '))
          done()
        })
      })
    })
  })
