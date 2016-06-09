'use strict';
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function (app, db) {

    var User = db.model('user');
    var Order = db.model('order')
    var OrderDetail = db.model('order_detail')

    // When passport.authenticate('local') is used, this function will receive
    // the email and password to run the actual authentication logic.
    var strategyFn = function (email, password, done) {
        User.findOne({
                where: {
                    email: email
                }
            })
            .then(function (user) {
                // user.correctPassword is a method from the User schema.
                if (!user || !user.correctPassword(password)) {
                    done(null, false);
                } else {
                    // Properly authenticated.
                    done(null, user);
                }
            })
            .catch(done);
    };

    passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, strategyFn));

    // A POST /login route is created to handle login.
    app.post('/login', function (req, res, next) {

        var authCb = function (err, user) {
            console.log("USER", user)
            if (err) return next(err);

            if (!user) {
                var error = new Error('Invalid login credentials.');
                error.status = 401;
                return next(error);
            }


            // req.logIn will establish our session.
            req.logIn(user, function (loginErr) {
                if (loginErr) return next(loginErr);
                // We respond with a response object that has user with _id and email.
                // add these all to non-local authentication
                Order.findOne({where:{userId:user.id, paid_date: null}})
                .then(function(previous) {
                  if(previous) {
                    Order.findOne({where: {sessionId: req.session.passport.user, paid_date: null}})
                    .then(function(current){
                      OrderDetail.updateAttribute({orderId:current.id}, {where:{orderId:previous.id}})
                    })
                  }else {
                    Order.update({userId: user.id}, {where: {sessionId: req.session.passport.user, paid_date: null}})          
                  }
                })
                .catch(next)
                // .then(function() {})
                res.status(200).send({
                    user: user.sanitize()
                });
            });

        };

        passport.authenticate('local', authCb)(req, res, next);

    });

};
