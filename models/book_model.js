var db = require('./database');

/* Book model. Promise-based. */


/* Simply returns all the information about the books */
var getAllBooks = function() {
    return new Promise(function(resolve, reject) {
        db.any("SELECT id, name, author, isbn, book_cover_url, owner_id FROM books WHERE borrowed_to IS NULL")
            .then(function (data) {
                resolve(data);
            })
            .catch(function (error) {
                console.log(error);
                reject(error);
            });
    });
};

/* Inserts new book into the database. bookObject should have properties
 * name, author, isbn and book_cover_url.
 */
var addBook = function(userId, bookObject) {
    return new Promise(function(resolve, reject) {
            return db.none("INSERT INTO books(name, author, isbn, book_cover_url, borrowed_to, owner_id) VALUES" +
                 "($2, $3, $4, $5, null, $1)", [userId, bookObject.name, bookObject.author, bookObject.isbn, bookObject.book_cover_url])
            .then(function() {
                resolve();
            })
            .catch(function(error) {
                //TODO: Add user-friendly error-messages ( when one of the parameters is too long or something )
                reject(error);
            });
    });
};

var getUserBooks = function(userId) {
  return new Promise(function(resolve, reject) {
      return db.any("SELECT id, name, author, isbn, book_cover_url, borrowed_to FROM books WHERE owner_id=$1", [userId])
          .then(function(books) {
              resolve(books);
          })
          .catch(function(error) {
              reject(error);
          });
  });
};

var getUserBooksIds = function(userId) {
    return new Promise(function(resolve, reject) {
        return db.any("SELECT id FROM books WHERE owner_id=$1", [userId])
            .then(function(bookIds) {
                resolve(bookIds);
            })
            .catch(function(error) {
                reject(error);
            });
    });
};

var getBookOwner = function(bookId) {
    return new Promise(function(resolve, reject) {
        db.one("SELECT owner_id FROM books WHERE id=$1", [bookId])
            .then(function(data) {
                if(data)
                    resolve(data.owner_id);
                else
                    resolve(null);
            })
            .catch(function(error) {
                reject(error);
            });
        
    });
};

/* Gets all the books when sent an array of ids. bookIds needs to be an array
 * of bookIds, otherwise an empty array is returned.
 */
var getBooksById = function(bookIds) {
    if(bookIds.length == 0)
        return Promise.resolve([]);
    var idStringArray;
    if(Object.prototype.toString.call( bookIds ) === Object.prototype.toString.call( [] ))
        idStringArray = bookIds.join(', ');
    else
        return Promise.resolve([]);
    return new Promise(function(resolve, reject) {
       db.any("SELECT name, author, isbn, book_cover_url, borrowed_to FROM books WHERE id IN (" + idStringArray + ")")
           .then(function(books) {
               resolve(books);
           })
           .catch(function(error) {
               console.log(error);
               reject(error);
           });
    });
};

var getRandomBooks = function(numberOfBooks) {
    return new Promise(function(resolve, reject) {
        db.any("SELECT name, author, book_cover_url FROM books WHERE random() < 0.5 AND borrowed_to IS NULL LIMIT $1", [numberOfBooks])
            .then(function (data) {
                resolve(data);
            })
            .catch(function (error) {
                console.log(error);
                reject(error);
            });
    });
};

module.exports = {
    getAllBooks: getAllBooks,
    addBook: addBook,
    getUserBooks: getUserBooks,
    getUserBooksIds: getUserBooksIds,
    getBookOwner: getBookOwner,
    getBooksById: getBooksById,
    getRandomBooks: getRandomBooks
};