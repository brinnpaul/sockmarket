'use strict';
var router = require('express').Router();
module.exports = router;

router.use('/members', require('./members'));
router.use('/sock', require('./sock/sock'))
router.use('/review', require('./review/review'))
router.use('/order', require('./order/order'))

router.use('/user', require('./user.js'));
router.use('/like', require('./like.js'))

router.use('/search', require('./search/search'))

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});
// routes for sock and review by sockId (Product View) and userId (Profile View)
