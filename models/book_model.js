var db = require('./database');
var User = require('./user_model');

var getAllBooks = function() {
    db.any("SELECT name, author, description, isbn, book_cover_url FROM books")
        .then(function(data) {
            console.log(data);
        })
        .catch(function(error) {
            console.log(error);
        });
};

var addBook = function(username, bookObject) {
    return new Promise(function(resolve, reject) {
        User.getUserId(username)
            .then(function(id) {
                return db.none("INSERT INTO books(name, author, isbn, book_cover_url, borrowed_to, owner_id) VALUES" +
                    "($2, $3, $4, $5, null, $1)", [id, bookObject.name, bookObject.author, bookObject.isbn, bookObject.book_cover_url]);
            })
            .then(function() {
                resolve();
            })
            .catch(function(error) {
                //TODO: Add user-friendly error-messages ( when one of the parameters is too long or something )
                reject(error);
            });
    });
};

var getUserBooks = function(username) {
  return new Promise(function(resolve, reject) {
      User.getUserId(username)
          .then(function(id) {
              return db.any("SELECT id, name, author, isbn, book_cover_url, borrowed_to FROM books WHERE owner_id=$1", [id]);
          })
          .then(function(books) {
              resolve(books);
          })
          .catch(function(error) {
              reject(error);
          });
  });
};

var getUserBooksIds = function(username) {
    return new Promise(function(resolve, reject) {
        User.getUserId(username)
            .then(function(id) {
                return db.any("SELECT id FROM books WHERE owner_id=$1", [id]);
            })
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
            })
            .catch(function(error) {
                reject(error);
            });
        
    });
};

var getBookById = function(bookId) {
    return new Promise(function(resolve, reject) {
       db.one("SELECT name, author, isbn, book_cover_url, borrowed_to FROM books WHERE id=$1", [bookId])
           .then(function(book) {
               resolve(book);
           })
           .catch(function(error) {
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
    getBookById: getBookById
};