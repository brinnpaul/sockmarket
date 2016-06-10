'use strict';

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function (app, db) {

    var User = db.model('user');

    var googleConfig = app.getValue('env').GOOGLE;

    var googleCredentials = {
        clientID: googleConfig.clientID,
        clientSecret: googleConfig.clientSecret,
        callbackURL: googleConfig.callbackURL,
        passReqToCallback: true

    };

    var verifyCallback = function (req, accessToken, refreshToken, profile, done) {
        User.findOne({
                where: {
                    google_id: profile.id
                }
            })
            .then(function (user) {
                if (user) {
                    user.sessionId = req.session.id
                    console.log("PROFILE", profile)
                    console.log("USER", user)
                    return user;
                } else {
                  console.log("PROFILE", profile)

                    return User.create({
                        google_id: profile.id,
                        first_name: profile.name.givenName,
                        last_name: profile.name.familyName,
                        username: profile.emails[0].value,
                        password: 'not important',
                        email: profile.emails[0].value
                    })
                    .then(function(newUser) {
                      newUser.sessionId = req.session.id
                      return newUser
                    })
                }
            })
            .then(function (userToLogin) {
                done(null, userToLogin);
            })
            .catch(function (err) {
                console.error('Error creating user from Google authentication', err);
                done(err);
            });

    };

    passport.use(new GoogleStrategy(googleCredentials, verifyCallback));

    app.get('/auth/google', passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    }));

    app.get('/auth/google/callback',
        passport.authenticate('google', {failureRedirect: '/login'}),
        function (req, res) {
            res.redirect('/');
        });

};
