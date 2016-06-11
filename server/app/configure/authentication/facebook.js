'use strict';
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function (app, db) {

    var User = db.model('user');

    var facebookConfig = app.getValue('env').FACEBOOK;

    var facebookCredentials = {
        clientID: facebookConfig.clientID,
        clientSecret: facebookConfig.clientSecret,
        callbackURL: facebookConfig.callbackURL,
        profileFields: ['id', 'displayName', 'email', 'photos'],
        passReqToCallback: true
    };

    var verifyCallback = function (req, accessToken, refreshToken, profile, done) {
        console.log("PROFILLLLEEEE", profile)
        console.log("REQUEST SEESSSSIONNN", req.session)
        User.findOne({
                where: {
                    facebook_id: profile.id
                }
            })
            .then(function (user) {
                if (user) {
                  user.sessionId = req.session.id
                    return user;
                } else {
                    console.log("EEEEEEEMMMMMMMAAAAIIIIILLLLLLL", profile.emails[0].value,
                                 '\n', profile.displayName.split(' ')[0],
                                 '\n', profile.displayName.split(' ')[1],
                                 '\n' )
                    return User.create({
                        facebook_id: profile.id,
                        email: 'not@available.com',
                        profile_pic: profile.photos[0].value,
                        first_name: profile.displayName.split(' ')[0],
                        last_name: profile.displayName.split(' ')[1] || 'not available',
                        password: 'not important',
                        username: '@'+profile.displayName.split[0]
                    })
                    .then(function(user) {
                      user.sessionId = req.session.id
                      return user
                    })
                }
            })
            .then(function (userToLogin) {
              console.log("AM I RUNNNING")
                done(null, userToLogin);
            })
            .catch(function (err) {
                console.error('Error creating user from Facebook authentication', err);
                done(err);
            })

    };

    passport.use(new FacebookStrategy(facebookCredentials, verifyCallback));

    app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {failureRedirect: '/login'}),
        function (req, res) {
            res.redirect('/');
        });

};
