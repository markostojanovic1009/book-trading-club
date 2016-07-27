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


/* Home page. If the user isn't logged in
 * it displays an introduction text, if he is
 * it displays 2 random books and offers him to look more
 */
router.get('/', function(req, res) {
    var user = getUser(req);
    if(!user) {
        res.render('index');
    } else {
        Book.getRandomBooks(2)
            .then(function (books) {
                res.render('index', {
                    user: user,
                    randomBooks: books
                });
            })
            .catch(function () {
                res.render('index', {user: user});
            });
    }
});


/* User sign-up page */
router.get('/register', function(req, res) {
  res.render('register');
});

/* User login page */
router.get('/login', function(req, res) {
  res.render('login');
});


/* User registration.
 * Calls User model to add the new user,
 * redirects directly with user-friendly error message
 * from the model.
 */
router.post('/register', function(req, res) {
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
router.post('/login', function(req, res) {
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
router.get('/logout', function(req, res) {
   req.session.user = null;
    res.redirect('/');
});


/* Lists all the books from the database.
 * If the user isn't logged in it displays all books
 * with the option to trade. If not, it calls Trade model
 * to see whether the user already requested that book.
 */
router.get('/books', function(req, res) {
    var allBooks = [];
    var user = getUser(req);
    Book.getAllBooks()
        .then(function(data) {
            allBooks = data;
            if(user) {
                return Trade.getUserTrades(user.id);
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
