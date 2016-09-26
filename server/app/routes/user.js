var router = require('express').Router();
module.exports = router;
var db = require("../../db")
var User = db.model("user");
var Sock = db.model("sock");
//var User = models.user

 router.param('userId', function (req, res, next, id) {
 	User.findById(id)
  .then(function (user) {
    return user.takeoutPassword()
  })
 	.then(function (user) {
 		if (!user) res.status(404).send();
 		req.userById = user;
 		next();
    })
 	.catch(next);
 })

router.get('/all', function (req, res, next) {
    User.findAll({include: {
      model: Sock
    }})
        .then(function (users) {
            if (!users) res.status(404).send();
            else res.send(users)
        })
        .catch(next);
})

router.post('/matchId', function (req, res, next) {
    User.findById(req.user.id)
    .then(function (user) {
      user.takeoutPassword()
    })
    .then(function (user) {
      if (user) res.send(true)
        else res.send(false)
    })
    .catch(next);
})

router.get('/:userId', function (req, res, next) {
	res.send(req.userById);
})

router.post('/', function (req, res, next) {
  User.create(req.body)
  .then(function(newUser) {
    res.send(newUser)
  })
  .catch(next)
})

router.put('/:id', function (req, res, next) {
  var id = req.params.id;

  User.findById(id)
  .then(function (user) {
    takeoutPassword()
  })
  .then(function(user){
    if (user.id == req.user.id) return user.update(req.body)
    else throw error
  })
  .then(function(response){
    res.send(response);
  })
  .catch(next);
})

router.put('/makeAdmin/:id', function (req, res, next) {
  var id = req.params.id;

  User.findById(id)
  .then(function (user) {
    takeoutPassword()
  })
  .then(function(user){
    console.log('THE USER', user.isAdmin)
    if (req.user.isAdmin && !user.isAdmin) {
      return user.update({isAdmin: true})
      .then(function (result) {
        console.log('RESULT1', result)
        return user
      })
    } else if (req.user.isAdmin && user.isAdmin) {
      return user.update({isAdmin: false})
      .then(function (result) {
        console.log('RESULT2', result)
        return user
      })
    }
  })
  .then(function(updatedUser){
    console.log('UPDATED USER', updatedUser)
    res.send();
    return updatedUser.isAdmin
  })
  .catch(next);
})

router.post('/delete/:id', function (req, res, next) {
  var id = req.params.id;

  User.findById(id)
  .then(function (user) {
    user.takeoutPassword()
  })
  .then(function(user){
    // console.log('ISADMIN', req.user.isAdmin)
    if (user.id == req.user.id || req.user.isAdmin) return user.destroy()
    else throw error
  })
  .then(function(response){
    res.send(response);
  })
  .catch(next);
})


