/*

This seed file is only a placeholder. It should be expanded and altered
to fit the development of your application.

It uses the same file the server uses to establish
the database connection:
--- server/db/index.js

The name of the database used is set in your environment files:
--- server/env/*

This seed file has a safety check to see if you already have users
in the database. If you are developing multiple applications with the
fsg scaffolding, keep in mind that fsg always uses the same database
name in the environment files.

*/

var chalk = require('chalk');
var db = require('./server/db');
var User = db.model('user');
var Sock = db.model('sock')
var Promise = require('sequelize').Promise;

var seedUsers = function () {

    var users = [
        {
            email: 'testing@fsa.com',
            password: 'password',
            username: '@test',
            first_name: "first",
            last_name: "test",
        },
        {
            email: 'obama@gmail.com',
            password: 'potus',
            username: '@BarryO',
            first_name: "Barack",
            last_name: "Obama",
            profile_pic: "http://texwillerblog.com/wordpress/wp-content/uploads/2012/01/Barack-Obama-200x200.jpg",
            city: "Chicago, IL"

        }

    ];

    var creatingUsers = users.map(function (userObj) {
        return User.create(userObj);
    });

    return Promise.all(creatingUsers);

};

var seedSocks = function () {
  var socks = [
    {
        title: 'socks by obama',
        description: 'great socks',
        tags: 'change',
        userId: 2,
        image: 'http://www.wigglestatic.com/product-media/5360088900/1000m-ult-hw-sock-navy.jpg?w=2000&h=2000&a=7'
    },
    {
      title: 'sockz: return of the socks',
      description: 'crazy drama about socks wearing socks',
      tags: 'drama sockz',
      userId: 2,
      image: 'http://cdn3.volusion.com/uctgf.ukzte/v/vspfiles/photos/The-Water-2.jpg?1439196114'
    },
    {
      title: 'hello socks!',
      description: 'crazy drama about socks wearing socks',
      tags: 'drama sockz',
      userId: 2,
      image: 'http://www.herringshoes.co.uk/_shop/imagelib/6/1527/5549/herring_cuthbert_sock_in_red_multi_1.jpg'
    },
    {
      title: 'socks socks socks',
      description: 'made in usa',
      tags: 'blue red white',
      userId: 2,
      image: 'http://www.sweaterscapes.com/images/sock-ins.jpg'
    }
  ]

  var creatingSocks = socks.map(function(sockObj) {
    return Sock.create(sockObj)
  })

  return Promise.all(creatingSocks)
}

db.sync({ force: true })
    .then(function () {
        return seedUsers();
    })
    .then(function() {
      return seedSocks()
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    })
    .catch(function (err) {
        console.error(err);
        process.kill(1);
    });
