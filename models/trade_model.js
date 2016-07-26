var db = require('./database');
var Book = require('./book_model');
var User = require('./user_model');

var requestBook = function(username, bookId) {
    var requestBy, requestTo;
    return new Promise(function(resolve, reject) {
       User.getUserId(username)
           .then(function(requestById) {
             requestBy = requestById;
             return Book.getBookOwner(bookId);
           })
           .then(function(requestToId) {
               requestTo = requestToId;
               if(requestTo == requestBy) {
                  return Promise.reject({
                       message: "You can't trade books with yourself."
                   });
               }
               return db.one("SELECT COUNT(*) FROM trades WHERE requested_book=$1 AND request_by=$2", [bookId, requestBy]);
           })
           .then(function(trade){
               if(trade.count > 0)
                   return Promise.reject({
                       message: "You have already requested to trade this book."
                   });
               return db.none('INSERT INTO trades(request_by, request_to, requested_book, trade_accepted, trade_start, trade_end)' +
                   ' VALUES($1, $2, $3, null, null, null)', [requestBy, requestTo, bookId]);
            })
           .then(function() {
               resolve();
           })
           .catch(function(error) {
               reject(error);
           });
    });
};

var acceptTrade = function(username, requestedBookId, tradeEndDate) {
    var userId;
    return new Promise(function(resolve, reject) {
        User.getUserId(username)
            .then(function(uId) {
                userId = uId;
                return db.any("SELECT COUNT(*) FROM trades WHERE requested_book=$1", [requestedBookId]);
            })
            .then(function(trade) {
                if(trade.count > 0) {
                    console.log("Book traded");
                    return reject({
                        message: "This book is already in a trade request"
                    });
                }
                return db.one("UPDATE trades SET trade_accepted=true, trade_start=$3, trade_end=$4 WHERE request_to=$1 " +
                    "AND requested_book=$2 returning request_by",
                    [userId, requestedBookId, (new Date()).toISOString(), tradeEndDate]);
            })
            .then(function(data) {
                return db.one("UPDATE books SET borrowed_to=$1 WHERE id=$2 returning name", [data.request_by, requestedBookId]);
            })
            .then(function(data) {
                resolve(data.name);
            })
            .catch(function(error) {
                reject(error);
            });
    });
};

var declineTrade = function(username, requestedBookId) {
    var userId;
    return new Promise(function(resolve, reject) {
        User.getUserId(username)
            .then(function(uId) {
                userId = uId;
                return db.any("SELECT COUNT(*) FROM trades WHERE requested_book=$1", [requestedBookId]);
            })
            .then(function(trade) {
                if(trade.count > 0)
                    reject({
                        message: "This book is already in a trade request"
                    });
                return db.none("UPDATE trades SET trade_accepted=false WHERE request_to=$1 " +
                    "AND requested_book=$2",
                    [userId, requestedBookId]);
            })
            .then(function() {
                resolve();
            })
            .catch(function(error) {
                reject(error);
            });
    });
};

var getUserTrades = function(username) {
    return new Promise(function(resolve, reject) {
       User.getUserId(username)
           .then(function(userId) {
               return db.any('SELECT request_by, request_to, b.id, b.name, b.author, b.book_cover_url, trade_accepted FROM trades as t ' +
                   'JOIN books as b ON t.requested_book=b.id WHERE t.request_to=$1 OR t.request_by=$1', [userId]);
           })
           .then(function(userTrades){
               resolve(userTrades);
           })
           .catch(function(error) {
               reject(error);
           });
    });
};

module.exports = {
    requestBook: requestBook,
    acceptTrade: acceptTrade,
    getUserTrades: getUserTrades,
    declineTrade: declineTrade
};