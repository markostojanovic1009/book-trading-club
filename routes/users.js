var express = require('express');
var router = express.Router();
var User = require('../models/user_model');
var Books = require('../models/book_model');
var Trades = require('../models/trade_model');


var loggedIn = function(req, username) {
    return req.session.user && req.session.user.username == username;
};

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
    if(loggedIn(req, username)) {
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
    if(!loggedIn(req, username))
        return;

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
    if(!loggedIn(req, username))
       return res.redirect('/login');
    Books.getUserBooks(username)
        .then(function(booksArray) {
            res.render('user_books', {
                user: req.session.user,
                books: booksArray,
                error: res.locals.userMessage
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
    var username = req.session.user.username;
    if(!loggedIn(req, username))
        return res.redirect('/login');
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

router.get('/:username/trades', function(req, res, next) {
    var username = req.params.username;
    if(!loggedIn(req, username))
        return res.redirect('/login');
    var tradesForUser = [], tradesFromUser = [];
    Trades.getUserTrades(username)
        .then(function(userTrades) {
            tradesForUser = userTrades.filter(function(trade) {
                return trade.request_to == req.session.user.id && trade.trade_accepted === null;
            });
            tradesFromUser = userTrades.filter(function(trade) {
               return trade.request_by == req.session.user.id;
            });
            return Trades.deleteDeclinedTrades(req.session.user.id);
        })
        .then(function(){
            res.render('trades', {
                user: req.session.user,
                tradesForUser: tradesForUser,
                tradesFromUser: tradesFromUser,
                userMessage: res.locals.userMessage
            });
        })
        .catch(function(error) {
            res.render('trades', {
                user: req.session.user,
                userMessage: error
            });
        });
});

router.post('/:username/trades', function(req, res, next) {
    var username = req.params.username;
    if(!loggedIn(req, username))
        return res.redirect('/login');
    var tradeResult = req.body.trade_decision;
    var bookId = req.body.book_id;
    if(tradeResult == "Accept") {
        Trades.acceptTrade(username, bookId)
            .then(function(bookName) {
                req.session.userMessage = {
                    code: 6000,
                    message: "You've borrowed your" + bookName + " to another user!"
                };
                console.log("Accepted trade");
                res.redirect('/user/' + username + '/trades');
            })
            .catch(function(error) {
               console.log(error);
                req.session.userMessage = error;
                res.redirect('/user/' + username + '/trades');
            });
    } else if(tradeResult == "Decline") {
        Trades.declineTrade(username, bookId)
            .then(function(bookName) {
                req.session.userMessage = {
                    code: 6000,
                    message: "You've borrowed your" + bookName + " to another user!"
                };
                res.redirect('/user/' + username + '/trades');
            })
            .catch(function(error) {
                console.log(error);
                req.session.userMessage = error;
                res.redirect('/user/' + username + '/trades');
            });
    } else {
        res.redirect('/');
    }
});
router.post('/:username/trades/new', function(req, res, next) {
    var username = req.params.username;
    if(!loggedIn(req, username))
        res.redirect('/');
    Trades.requestBook(username, req.body.book_id)
        .then(function() {
            req.session.userMessage = {
                code: 6000,
                message: "Your trade request has been sent!"
            };
            res.redirect('/user/' + username + '/trades');
        })
        .catch(function(error) {
           req.session.userMessage = error;
            res.redirect('/user/' + username + '/trades');
        });
});

module.exports = router;