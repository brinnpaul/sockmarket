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
var Sock = db.model('sock');
var Review = db.model('review');
var Promise = require('sequelize').Promise;

var seedUsers = function () {

    var users = [
        {
            email: 'a@a.com',
            password: '123123',
            username: '@test',
            first_name: "first",
            last_name: "test",
            isAdmin: "true"
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
    },
    {
        title: 'socks by obama1241235',
        description: 'great socks41234123',
        tags: 'change politics trumpin',
        userId: 2,
        image: 'http://www.wigglestatic.com/product-media/5360088900/1000m-ult-hw-sock-navy.jpg?w=2000&h=2000&a=7'
    },
    {
      title: 'sockz: return of the socks 12321',
      description: 'crazy drama about socks wearing socks123123',
      tags: 'drama sockz dread',
      userId: 2,
      image: 'http://cdn3.volusion.com/uctgf.ukzte/v/vspfiles/photos/The-Water-2.jpg?1439196114'
    },
    {
      title: 'hello socks!1231533',
      description: 'crazy drama about socks wearing socks',
      tags: 'drama sockz socking rocking rolling',
      userId: 2,
      image: 'http://www.herringshoes.co.uk/_shop/imagelib/6/1527/5549/herring_cuthbert_sock_in_red_multi_1.jpg'
    },
    {
      title: 'socks socks socks 12312124 1',
      description: 'made in usa made everywhere',
      tags: 'blue red white blossom',
      userId: 2,
      image: 'http://www.sweaterscapes.com/images/sock-ins.jpg'
    },
    {
        title: 'socks by obama 190241924',
        description: 'great socks amazing blue',
        tags: 'change',
        userId: 2,
        image: 'http://www.wigglestatic.com/product-media/5360088900/1000m-ult-hw-sock-navy.jpg?w=2000&h=2000&a=7'
    },
    {
      title: 'sockz: return of the socks truthy',
      description: 'crazy drama about socks wearing socks1231223',
      tags: 'drama sockz glue',
      userId: 2,
      image: 'http://cdn3.volusion.com/uctgf.ukzte/v/vspfiles/photos/The-Water-2.jpg?1439196114'
    },
    {
      title: 'hello socks! 3eiq',
      description: 'crazy drama about socks wearing socks qorih23',
      tags: 'drama sockz magnificent',
      userId: 2,
      image: 'http://www.herringshoes.co.uk/_shop/imagelib/6/1527/5549/herring_cuthbert_sock_in_red_multi_1.jpg'
    },
    {
      title: 'socks socks socks32u3hr',
      description: 'made in usa house',
      tags: 'blue red white groundhog day',
      userId: 2,
      image: 'http://www.sweaterscapes.com/images/sock-ins.jpg'
    },
    {
        title: 'socks by obama12312',
        description: 'great socks',
        tags: 'change',
        userId: 2,
        image: 'http://www.wigglestatic.com/product-media/5360088900/1000m-ult-hw-sock-navy.jpg?w=2000&h=2000&a=7'
    },
    {
      title: 'sockz: return of the socks123123',
      description: 'crazy drama about socks wearing socks12312',
      tags: 'drama sockz',
      userId: 2,
      image: 'http://cdn3.volusion.com/uctgf.ukzte/v/vspfiles/photos/The-Water-2.jpg?1439196114'
    },
    {
      title: 'hello socks!12312',
      description: 'crazy drama about socks wearing socks1231',
      tags: 'drama sockz',
      userId: 2,
      image: 'http://www.herringshoes.co.uk/_shop/imagelib/6/1527/5549/herring_cuthbert_sock_in_red_multi_1.jpg'
    },
    {
      title: 'socks socks socks12312',
      description: 'made in usa1231',
      tags: 'blue red white',
      userId: 2,
      image: 'http://www.sweaterscapes.com/images/sock-ins.jpg'
    },
    {
        title: 'socks by obama234234',
        description: 'great socks23423',
        tags: 'change',
        userId: 2,
        image: 'http://www.wigglestatic.com/product-media/5360088900/1000m-ult-hw-sock-navy.jpg?w=2000&h=2000&a=7'
    },
    {
      title: 'sockz: return of the socks234234',
      description: 'crazy drama about socks wearing socks234234',
      tags: 'drama sockz',
      userId: 2,
      image: 'http://cdn3.volusion.com/uctgf.ukzte/v/vspfiles/photos/The-Water-2.jpg?1439196114'
    },
    {
      title: 'hello socks!234234',
      description: 'crazy drama about socks wearing socks234234',
      tags: 'drama sockz',
      userId: 2,
      image: 'http://www.herringshoes.co.uk/_shop/imagelib/6/1527/5549/herring_cuthbert_sock_in_red_multi_1.jpg'
    },
    {
      title: 'socks socks socks124124',
      description: 'made in usa234234',
      tags: 'blue red white',
      userId: 2,
      image: 'http://www.sweaterscapes.com/images/sock-ins.jpg'
    },
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
    },
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
    },
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
    },
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

var seedReviews = function() {

  var reviews = [
    {
      text: "Most amazing toe feel",
      userId: 1,
      sockId: 1,
    },
    {
      text: "Most amazing foot feel",
      userId: 1,
      sockId: 2,
    },
    {
      text: "terribly amazing foot feel",
      userId: 2,
      sockId: 3,
    },
    {
      text: "terribly amazing mouth feel",
      userId: 2,
      sockId: 4,
    },
  ];
  var creatingReview = reviews.map(function(reviewObj) {
    return Review.create(reviewObj)
  })

  return Promise.all(creatingReview)
}

db.sync({ force: true })
    .then(function () {
        return seedUsers();
    })
    .then(function() {
      return seedSocks()
    })
    .then(function() {
      return seedReviews()
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    })
    .catch(function (err) {
        console.error(err);
        process.kill(1);
    });
