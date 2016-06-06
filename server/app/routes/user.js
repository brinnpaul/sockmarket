var router = require('express').Router();
module.exports = router;
var models = require('../../db/models/user.js')
var User = models.user

// router.param('id', function (req, res, next, id) {
// 	User.findById(id)
// 	.then(function (user) {
// 		if (!user) res.status(404).send();
// 		req.userById = user;
// 		next();)
// 	})
// 	.catch(next);
// })

router.get('/', function (req, res, next) {
	console.log('------->WE ARE HERE')
	res.send('hello')
	// res.send(req.userById);
})

// router.get('/users', function (req, res, next) {
// 	User.findAll()
// 	.then(function (users) {
// 		if (!users) res.status(404).send();
// 		else res.send(users)
// 	})
// 	.catch(next);
// })