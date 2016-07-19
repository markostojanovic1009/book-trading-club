var express = require('express');
var router = express.Router();
var User = require('../models/user_model');


router.get('/', function(req, res, next) {
  res.render('index', {  });
});


/* User sign-up page */
router.get('/register', function(req, res, next) {
  res.render('register');
});

/* User login page */
router.get('/login', function(req, res, next) {
  res.render('login');
});

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


module.exports = router;
