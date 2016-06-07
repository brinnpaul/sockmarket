var router = require('express').Router();
module.exports = router;
var db = require("../../db")
var User = db.model("user");
//var User = models.user

 router.param('userId', function (req, res, next, id) {
     console.log("HERERERERERE",User);
 	User.findById(id)
 	.then(function (user) {
 		if (!user) res.status(404).send();
 		req.userById = user;
 		next();
    })
 	.catch(next);
 })

router.get('/all', function (req, res, next) {
    User.findAll()
        .then(function (users) {
            if (!users) res.status(404).send();
            else res.send(users)
        })
        .catch(next);
})


router.get('/:userId', function (req, res, next) {
	console.log('------->WE ARE HERE')
	//res.send('hello')
	res.send(req.userById);
})

