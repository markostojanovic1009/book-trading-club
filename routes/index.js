var express = require('express');
var router = express.Router();
var User = require('../models/user_model');
var Book = require('../models/book_model');
var Trade = require('../models/trade_model');

var getUser = function(req) {
    if(req.session.user) {
        return req.session.user
    } else {
        return null;
    }
};

router.get('/', function(req, res, next) {
  res.render('index', {user: getUser(req)});
});


/* User sign-up page */
router.get('/register', function(req, res, next) {
  res.render('register');
});

/* User login page */
router.get('/login', function(req, res, next) {
  res.render('login');
});


/* User registration.
 * Calls User model to add the new user,
 * redirects directly with user-friendly error message
 * from the model.
 */
router.post('/register', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  User.addUser(username, password, email)
      .then(function(data) {
        req.session.user = data;
        res.redirect('/');
      })
      .catch(function(error) {
        console.log(error);
        res.render('register', error);
      });
});


/* Authentication route. Saves user { username } to req.session
 * Redirects to back to /login with user-friendly error message if wrong
 * info was passed.
 */
router.post('/login', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  User.verifyUser(username, password)
      .then(function(user) {
        req.session.user = user;
        res.redirect('/');
      })
      .catch(function(error) {
        res.render('login', error);
      });
});

/* Simply deletes req.session.user */
router.get('/logout', function(req, res, next) {
   req.session.user = null;
    res.redirect('/');
});


router.get('/books', function(req, res, next) {
    var allBooks = [];
    var user = getUser(req);
    Book.getAllBooks()
        .then(function(data) {
            allBooks = data;
            if(user) {
                return Trade.getUserTrades(user.username);
            } else {
                res.render('all_books', {
                    user: user,
                    books: data
                });
            }
        })
        .then(function(userTrades) {
           userTrades.forEach(function(trade) {
               for(var i = 0; i < allBooks.length; i++) {
                   if(allBooks[i].id == trade.id && trade.request_by == user.id && trade.trade_accepted === null) {
                       allBooks[i].trade_requested = true;
                   }
               }
           });
           res.render('all_books', {
               user: user,
               books: allBooks
           })
        })
        .catch(function(error) {
            res.render('all_books', {
                user: getUser(req),
                error: error
            });
        });
});

module.exports = router;
