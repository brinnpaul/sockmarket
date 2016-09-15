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
var Order = db.model('order');
var OrderDetail = db.model('order_detail');
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
        },
        {
            email: 'bex@bex.com',
            password: 'asldfkj',
            username: '@Bex',
            first_name: 'Bex',
            last_name: 'Rosenblatt',
            profile_pic: 'https://scontent-lga3-1.xx.fbcdn.net/v/t1.0-1/p100x100/13700056_10207110079535082_4219144356567438027_n.jpg?oh=2ac1894e5c01e8cc53261e292ced1a60&oe=58395A1A',
            city: "Jerusalem, Israel"
        },
        {
            email: "Ben@Ben.com",
            password: 'asdlfj',
            username: "@Benny",
            first_name: "Ben",
            last_name: "Manson",
            city: "Jerusalem, Israel"
        },
        {
            email: "Brinn@B.com",
            password: 'apsdfj',
            username: "@Brinn",
            first_name: "Brinn",
            last_name: "Riordan",
            city: "Wichita, KS"
        },
        {
            email: "John@H.com",
            password: 'alsdkfj',
            username: "@JohnH",
            first_name: "John",
            last_name: "Humiston",
            city: "New York, NY"
        },
        {
            email: "John@B.com",
            password: 'asldkfj',
            username: "@JohnB",
            first_name: "John",
            last_name: "Backes",
            city: "New York, NY"
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
      title: 'sock',
      description: 'The sockiest of all socks',
      tags: 'sockington',
      userId: 1,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/NhM44oiRug287GhOuB8A65cfo.png'
    },
    {
      title: 'Rudolph Socks',
      description: 'A very shiny nose.',
      tags: 'reindeer Rudolph',
      userId: 2,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/J45633j39Nm5RZyk6IueBY17H.png'
    },
    {
      title: 'Non-Matching Socks',
      description: 'non-matching',
      tags: 'not-together',
      userId: 2,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/YxelC6VUKTxRHzL3rKdaUjw8V.png'
    },
    {
      title: "Sorry, the Dog ate my Socks",
      description: "You are what you eat...",
      tags: "LameExcuses Sorry the Dog ate my Socks",
      userId: 3,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/UotNOwUnY6VqXrVgRuCgz1U4Q.png'
    },
    {
      title: "Socks with Soccer Ball",
      description: "Soccer ball not included!",
      tags: "white",
      userId: 4,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/EOgvp358zIPjo4PKwt95pp6eQ.png',
    },
    {
      title: "Brinn's Socks",
      description: "They're great",
      tags: "greatness",
      userId: 5,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/wlz2BM8QhTf0p4m4YcbR72D26.png',
    },
    {
      title: "JP is Terrible",
      description: "ugh make it stop",
      tags: "oaway",
      userId: 6,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/673lS4TQ2k2gPS8e7wPC2HJGi.png',
    },
    {
      title: "ruptestsock",
      description: "rup test",
      tags: "uptest",
      userId: 1,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/UnNP7EGZnfL29B569CQ3ryGhS.png',
    },
    {
      title: "Santa Socks",
      description: "santa socks",
      tags: "red green christmas",
      userId: 7,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/N23zc8UsR8BeMLtTGqEBYqkBy.png',
    },
    {
      title: "Pizza Socks!",
      description: "Now in mushroom and pepperoni!",
      tags: "Ohmnohmnohm",
      userId: 3,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/QpC9d6J5gPeBe66gN18x23QNh.png',
    },
    {
      title: "Arnav's Sock",
      description: " Arnav thinks hes great at wingsuiting",
      tags: "wingsuits",
      userId: 5,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/xTVUOoZA6wSztsLi2bkff14Iq.png',
    },
    {
      title: "Zorro Marconi",
      description: "Amazing Italian",
      tags: "zorro",
      userId: 5,
      image: 'https://s3.amazonaws.com/sockmarket%2Fsocks/JVuBFA1rGWRtciw9FNdeUjUkA.png',
    },
    {
      title: "Patriotic American Flag",
      description: "The socks are plain white socks, but they come with a flag so people will still know you're a patriot.",
      tags: "usa",
      userId: 2,
      image: "https://s3.amazonaws.com/sockmarket%2Fsocks/3CPDZHtrOZgL2l3g13QeZpoVI.png",
    },
    {
      title: "Two pairs of socks, one glows in the dark",
      description: "This is a pair of socks, but only one is currently visible.",
      tags: "spooky",
      userId: 4,
      image: "https://s3.amazonaws.com/sockmarket%2Fsocks/7z35vT7MUu2RLDHn1ABh2jPEl.png",
    },
    {
      title: "PRESIDENTIAL SOCKS",
      description: "patriotic socks!!",
      tags: "USA",
      userId: 2,
      image: "https://s3.amazonaws.com/sockmarket%2Fsocks/71BG8TZy0QA1Ao9iNbF5y35oz.png",
    }
  ];

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

var seedOrders = function() {
  var orders = [
    { date_paid: '08-09-16',
      userId: 1
    },
    { date_paid: '01-09-16',
      userId: 2
    },
    { date_paid: '02-09-16',
      userId: 3
    },
    { date_paid: '03-09-16',
      userId: 4
    },
    { date_paid: '04-09-16',
      userId: 5
    }
  ];

  var creatingOrder = orders.map(function(order) {
    return Order.create(order)
  })

  return Promise.all(creatingOrder)
}

var seedOrderDetail = function() {
  var orderDetail = [
    {
      quantity: 1,
      orderId: 2,
      sockId: 11
    },
    {
      quantity: 1,
      orderId: 3,
      sockId: 5
    },
    {
      quantity: 1,
      orderId: 4,
      sockId: 6
    },
    {
      quantity: 1,
      orderId: 1,
      sockId: 10
    },
    {
      quantity: 1,
      orderId: 5,
      sockId: 8
    }
  ];

  var creatingOrderDetail = orderDetail.map(function(orderdetail) {
    return OrderDetail.create(orderdetail)
  })

  return Promise.all(creatingOrderDetail)
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
    .then(function() {
      return seedOrders()
    })
    .then(function() {
      return seedOrderDetail()
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    })
    .catch(function (err) {
        console.error(err);
        process.kill(1);
    });
