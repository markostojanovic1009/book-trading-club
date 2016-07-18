var pgp = require('pg-promise')();
var app = require('express')();
var dbOptionsDevelopment = {
    host: 'localhost',
    port: 5432,
    database: 'book_trading_db',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PWORD
};

var dbOptionsTest = {
    host: 'localhost',
    port: 5432,
    database: 'book_trading_db_test',
    user: 'postgres',
    password: 'postgres'
};

var dbOptions = {
    development: dbOptionsDevelopment,
    test: dbOptionsTest,
    production: null
};

var db = pgp(dbOptions[app.get('env')]);

/*db.connect().then( function(obj) {
    console.log("Successfully connected");
    obj.done();
}).catch(function(error){
   console.log("Database connection error: ", error);
});*/

module.exports = db;