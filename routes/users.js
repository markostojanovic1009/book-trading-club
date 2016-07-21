var express = require('express');
var router = express.Router();
var User = require('../models/user_model');
var Books = require('../models/book_model');
var request = require('request');
var requestPromise = require('request-promise');

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

/* Leads to user profile which enables the user to change profile info such
 * as email, city or country.
 */
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


router.get('/:username/books', function(req, res, next) {
   var username = req.params.username;
    if(!req.session.user)
       return res.redirect('/login');
    Books.getUserBooks(username)
        .then(function(booksArray) {
            console.log(booksArray);
            res.render('user_books', {
                user: req.session.user,
                books: booksArray
            });
        })
        .catch(function(error) {
           console.log(error);
            res.render('user_books', {
                user: req.session.user,
                error: error
            });
        });
});

router.post('/:username/books', function(req, res, next) {
   if(!req.session.user)
       res.redirect('/login');
    var username = req.session.user.username;
    Books.addBook(username, {
        name: req.body.title,
        author: req.body.author,
        book_cover_url: req.body.book_cover_url,
        isbn: req.body.isbn
        })
        .then(function() {
            res.redirect('/user/' + username + '/books');
        })
        .catch(function(error) {
            console.log(error);
            req.session.userMessage = error;
            res.redirect('/user/' + username + '/books');
        });
});

module.exports = router;