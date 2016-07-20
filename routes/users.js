var express = require('express');
var router = express.Router();
var User = require('../models/user_model');

/* Leads to user profile which enables the user to change profile info such
 * as email, city or country.
 */


/* User-friendly error handling middleware.
 * Uses req.session to transfer error between requests
 * and then saves it to res.locals - this guarantees
 * that nothing in req will be overwritten. The local objects from req
 */
router.use(function(req, res, next) {
    if(req.session.userMessage) {
        res.locals.userMessage = req.session.userMessage;
        req.session.userMessage = null;
    }
    next();
});
router.get('/:username', function(req, res, next) {
    var username = req.params.username;
    if(req.session.user && req.session.user.username == username) {
        User.getUser(username)
            .then(function(data) {
                res.render('user', {
                    user: data
                });
            })
            .catch(function(error) {
                res.render('user', {
                    userMessage: error
                });
            });
    } else {
        res.redirect('/login');
    }

});

router.post('/:username', function(req, res, next) {
    var username = req.params.username;
    var email = req.body.email;
    var city = req.body.city;
    if(city == '')
        city = null;
    var country = req.body.country;
    if(country == '')
        country = null;
    var newUser = {username: username, email: email, city: city, country: country};
    User.updateUser(newUser)
        .then(function(){
            res.render('user', {
                userMessage: {
                    code: User.SUCCESSFUL_OPERATION_CODE,
                    message: "Your profile information has been updated."
                },
                user: newUser
            });
        })
        .catch(function(error) {
            req.session.userMessage = error;
            res.redirect('/user/' + username);
        });
});


module.exports = router;