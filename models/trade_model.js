var db = require('./database');
var Book = require('./book_model');
var User = require('./user_model');

var requestBook = function(username, bookId) {
    var requestBy;
    return new Promise(function(resolve, reject) {
       User.getUserId(username)
           .then(function(requestById) {
             requestBy = requestById;
             return Book.getBookOwner(bookId);
           })
           .then(function(requestTo) {
               if(requestTo == requestBy) {
                  return Promise.reject({
                       message: "You can't trade books with yourself."
                   });
               } else {
                   return db.none('INSERT INTO trades(request_by, request_to, requested_book, trade_accepted, accepted_book, trade_start, trade_end)' +
                       ' VALUES($1, $2, $3, false, null, null, null)', [requestBy, requestTo, bookId]);
               }
           })
           .then(function() {
               resolve();
           })
           .catch(function(error) {
               reject(error);
           });
    });
};

var acceptTrade = function(username, requestedBookId, acceptedBookId, tradeEndDate) {
    var userId;
    return new Promise(function(resolve, reject) {
        User.getUserId(username)
            .then(function(uId) {
                userId = uId;
                return Book.getBookById(requestedBookId);
            })
            .then(function(book) {
                if(book.borrowed_to) {
                    return Promise.reject({
                        message: "You have already borrowed this book."
                    });
                }
                return db.one("UPDATE trades SET trade_accepted=true, accepted_book=$3, trade_start=$4, trade_end=$5 WHERE request_to=$1 " +
                    "AND requested_book=$2 returning request_by",
                    [userId, requestedBookId, acceptedBookId, (new Date()).toISOString(), tradeEndDate]);
            })
            .then(function(data) {
                return db.none("UPDATE books SET borrowed_to=$1 WHERE id=$2", [data.request_by, requestedBookId]);
            })
            .then(function() {
                resolve();
            })
            .catch(function(error) {
                reject(error);
            });
    });
};

module.exports = {
    requestBook: requestBook,
    acceptTrade: acceptTrade
};