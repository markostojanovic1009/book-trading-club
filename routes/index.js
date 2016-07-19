var express = require('express');
var router = express.Router();
var User = require('../models/user_model');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* User sign-up page */
router.get('/register', function(req, res, next) {
  res.render('register');
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

module.exports = router;
