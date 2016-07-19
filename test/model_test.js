process.env.NODE_ENV = "test";

var chai = require('chai');
var should = chai.should();

var db = require('../models/database');


chai.use(require('chai-as-promised'));

describe('ModelTest', function () {
    before(function (done) {
        db.none("CREATE TABLE users(id SERIAL UNIQUE, " +
                "username varchar(50) UNIQUE NOT NULL," +
                "hash varchar(200) NOT NULL," +
                "email varchar(200) UNIQUE NOT NULL)")
        .then(function () {
            done();
        }).catch(function (error) {
            console.log(error);
        });
    });
    describe('User', function () {

        var bcrypt = require('bcryptjs');
        var User = require('../models/user_model');
        var user;
        before(function () {
            user = {
                username: 'username123',
                password: 'password123',
                email: 'foobar@gmail.com'
            };
        });

        describe('getUser', function () {
            before(function (done) {
                db.none("INSERT INTO users(username, hash, email) VALUES($1, $2, $3)", [user.username,
                        bcrypt.hashSync(user.password, bcrypt.genSaltSync(10)), user.email])
                    .then(function () {
                        done();
                    })
                    .catch(function (error) {
                        console.log('error');
                    });
            });

            it('should return a user when an existing username is passed', function () {
                return User.getUser(user.username).should.eventually.deep.equal({
                    username: user.username,
                    email: user.email
                });
            });

            it('should return an error when a nonexistent username is passed', function () {
                return User.getUser("nonexistent").should.be.rejected.and.eventually.have.property('message', 'Username nonexistent' +
                    ' not found.');
            });

        });

        describe('addUser', function () {
            var newUser = {
                username: "newuser321",
                password: "goombastomp101",
                email: "wildcard@hotmail.com"
            };

            it('should return an error when no username is sent', function () {
                return User.addUser().should.be.rejected.and.should.eventually.have.property('message',
                    'Username missing.');
            });

            it('should return an error when username is too short', function () {
                return User.addUser('shrt').should.be.rejected.and.should.eventually.have.property('message',
                    'Username must be at least 5 characters long.');
            });

            it('should return an error when username is too long', function () {
                return User.addUser('long'.repeat(10)).should.be.rejected.and.should.eventually.have.property('message',
                    "Username must be less than 30 characters long.");
            });

            it("should return an error when username contains forbidden characters", function () {
                return User.addUser('/??/-').should.be.rejected.and.should.eventually.have.property('message',
                    "Username must only contain letters and numbers.");
            });

            // No point including password testing, it's basically identical.

            it("should return an error when email has a wrong format", function () {
                return User.addUser(newUser.username, newUser.password, 'f@b@boongo').should.be.rejected.and.eventually.have.property('message',
                    'Please enter a valid email address.');
            });

            it("should insert a valid user into the database", function () {
                return User.addUser(newUser.username, newUser.password, newUser.email).should.be.fulfilled.and.eventually.deep
                    .equal({username: newUser.username, email: newUser.email});
            });

            it("should return an error when the user already exists", function () {
                return User.addUser(user.username, user.password, user.email).should.be.rejected.and.eventually.have.property('message',
                    "Username " + user.username + " already exists.");
            });

            it("should return an error when an email is already registered", function () {
                return User.addUser(user.username + "new", user.password, user.email).should.be.rejected.and.eventually.have.property('message',
                    "Email " + user.email + " already in use.");
            });

        });

        describe('updateUser', function () {

            var newEmail = "goomba@gmail.com";
            it("should return an error when username doesn't exist", function () {
                return User.updateUser({
                    username: user.username + "1",
                    email: newEmail
                }).should.be.rejected.and.eventually.have.property('message',
                    "Username " + user.username + "1" + " not found.");
            });

            it('should return an error when another user has the desired email', function () {
                return User.updateUser({
                    username: user.username,
                    email: "wildcard@hotmail.com"
                }).should.be.rejected.and.eventually.have.property('message',
                    "Email wildcard@hotmail.com already in use.");
            });

            it('should successfully update the user when valid arguments are passed', function () {
                return User.updateUser({username: user.username, email: newEmail}).should.be.fulfilled;
            })
        });

        describe('getUserId', function() {
            it("should return user's id when a valid username is passed", function() {
                return User.getUserId(user.username).should.be.fulfilled.and.should.eventually.equal(1);
            });

            it("should return an error when a nonexistent username is passed", function() {
               return User.getUserId("nonexistent").should.be.rejected.and.should.eventually.have.property('message',
                   'Username nonexistent not found.');
            });

        });

        describe('verifyUser', function() {
            it('should return an error when a nonexistent username is passed', function() {
                return User.verifyUser('nonexistent', 'nopassword').should.be.rejected.and.eventually.have.property('message', '' +
                    'Wrong username or password.');
            });

            it('should return an error when password is passed', function() {
                return User.verifyUser(user.username, 'wrongpassword').should.be.rejected.and.eventually.have.property('message', '' +
                    'Wrong username or password.');
            });

            it("should return a username when user is properly authenticated", function() {
               return User.verifyUser(user.username, user.password).should.be.fulfilled.and.eventually.deep.equal({
                   username: user.username });
            });
        });

    });

    describe('Book', function () {
        var Book = require('../models/book_model');

        var username = 'username123';
        var firstBook = {
            name: "Introduction To Algorithms",
            author: 'Thomas H. Cormen',
            description: 'Really good book that introduces people to fundamentals algorithms and data structures.',
            isbn: "978-0262033848",
            book_cover_url: "http://images.betterworldbooks.com/026/Introduction-to-Algorithms-Third-Edition-Cormen-Thomas-H-9780262533058.jpg"
        };

        before(function (done) {
            db.none("CREATE TABLE books( " +
                    "id SERIAL PRIMARY KEY," +
                    "name varchar(200) NOT NULL, " +
                    "author varchar(300)," +
                    "description text," +
                    "isbn varchar(14)," +
                    "book_cover_url varchar(200)," +
                    "owner_id integer REFERENCES users(id)," +
                    "borrowed_to integer REFERENCES users(id))")
                .then(function () {
                    console.log("Created books");
                    done();
                })
                .catch(function (error) {
                    console.log(error);
                });
        });

        describe('addBook', function () {


            it('should add book when passed valid info', function () {
                return Book.addBook(username, firstBook).should.be.fulfilled;
            });

            it('should display error when wrong username is passed', function() {
                return Book.addBook('wrongusername', firstBook).should.be.rejected.and.eventually.have.property('message',
                    'Username wrongusername not found.');
            });

            /* TODO: Add test for displaying the user-friendly message */
            it('should not add a book when one of the parameters is too long', function () {
                var wrongBook = {
                    name: "Introduction To Algorithms",
                    author: "author".repeat(70),
                    description: 'Really good book that introduces people to fundamentals algorithms and data structures.',
                    isbn: "978-0262033848",
                    book_cover_url: "http://images.betterworldbooks.com/026/Introduction-to-Algorithms-Third-Edition-Cormen-Thomas-H-9780262533058.jpg"
                };
                return Book.addBook(username, wrongBook).should.be.rejected;
            });

        });

        describe('getUserBook', function() {
            it('should display error when wrong username is passed', function() {
                return Book.getUserBooks('wrongusername').should.be.rejected.and.eventually.have.property('message',
                    'Username wrongusername not found.');
            });

            it('should return an array of books that belong to this user', function() {
                return Book.getUserBooks(username).should.be.fulfilled.and.eventually.deep.equal([{
                    name: firstBook.name,
                    author: firstBook.author,
                    description: firstBook.description,
                    isbn: firstBook.isbn,
                    book_cover_url: firstBook.book_cover_url,
                    id: 1,
                    borrowed_to: null
                }]);
            });
        });
        
        describe('getUserBooksIds', function() {
           
            it('should display an error when a wrong username is passed', function() {
                return Book.getUserBooksIds('wrongusername').should.be.rejected.and.eventually.have.property('message',
                    'Username wrongusername not found.');
            });

            it('should return an array of book ids that belong to this user', function() {
               return Book.getUserBooksIds(username).should.be.fulfilled.and.eventually.deep.equal([{id: 1}]);
            });
            
        });

        describe('getBookOwner', function() {

            it('should display an error when wrong book id is passed', function() {
               return Book.getBookOwner(1000).should.be.rejected.and.eventually.have.property('message');
            });

            it('should return a proper user id when passed valid info', function() {
                return Book.getBookOwner(1).should.be.fulfilled.and.eventually.deep.equal(1);
            });
        })

    });

    describe('Trade', function () {
        var user1 = {
            username: "johnking",
            password: "password123",
            email: "johncena@gmail.com"
        };
        var user2 = {
            username: "mcwestside",
            password: "pword00921",
            email: "loveitbaby2@yahoo.com"
        };

        var book1 = {
            name: "Harry Potter and the Prisoner of Azkaban",
            author: "J.K. Rowling",
            description: "Third iteration of the Harry Potter saga. Sirius Black escaped the prison...",
            isbn: "0439136369",
            book_cover_url: "http://pics1.this-pic.com/key/harry%20potter%20and%20the%20prisoner%20of%20azkaban%20book%20cover"
        };

        var book2 = {
            name: "Hitchhiker's Guide to the Galaxy",
            author: "Douglas Adams",
            isbn: "0345391802",
            book_cover_url: "https://2.bp.blogspot.com/-ED0m4tnNFUM/UP80yHRExFI/AAAAAAAACxM/I2yCxLiGcXY/s320/adams.hitchfive.cov.gif"
        };

        var book1Id = 2,
            book2Id = 3,
            user1Id = 5,
            user2Id = 6;

        var Trade = require('../models/trade_model');
        var User = require('../models/user_model');
        var Book = require('../models/book_model');
        before(function(done) {
           db.none("CREATE TABLE trades(" +
               "request_by integer REFERENCES users(id)," +
               "requested_book integer REFERENCES books(id)," +
               "request_to integer REFERENCES users(id)," +
               "accepted_book integer REFERENCES books(id)," +
               "trade_accepted boolean," +
               "trade_start date," +
               "trade_end date)")
               .then(function() {
                   User.addUser(user1.username, user1.password, user1.email);
               })
               .then(function() {
                   User.addUser(user2.username, user2.password, user2.email);
               })
               .then(function() {
                   Book.addBook(user1.username, book1);
               })
               .then(function() {
                   Book.addBook(user2.username, book2);
               })
               .then(function() {
                   done();
               })
               .catch(function(error) {
                   console.log(error);
               });
        });

        describe('requestBook', function() {
            it('should return an error when wrong username is passed', function() {
                return Trade.requestBook('wrongusername', book1Id).should.be.rejected.and.eventually.have.property('message',
                    'Username wrongusername not found.');
            });

            it('should return an error when trying to trade books with yourself', function() {
               return Trade.requestBook(user1.username, book1Id).should.be.rejected.and.eventually.have.property('message',
               "You can't trade books with yourself.");
            });

            it('should add a new trade request when valid info is passed', function() {
               return Trade.requestBook(user1.username, book2Id).should.be.fulfilled;
            });
        });
        
        describe('acceptTrade', function() {
            it('should properly accept trade when passed valid info and the other user selects a book', function() {
                var currentDate = new Date();
                var tradeEndDate = new Date(parseInt(currentDate.getFullYear() + 1) + "-"
                    + currentDate.getMonth() + "-" + currentDate.getDate());
               return Trade.acceptTrade(user2.username, book2Id, null, tradeEndDate).should.be.fulfilled;
            });

            it('should properly update table books to reflect the  successful trade', function() {
                return Book.getBookById(book2Id).should.eventually.have.property('borrowed_to', user1Id);
            });

            it('should return an error when trying to trade a book that isnt in your possession', function() {
                return Trade.acceptTrade(user2.username, book2Id, null, null).should.be.rejected.and.eventually.
                    have.property('message', "You have already borrowed this book.");
            })
        });
        
        
    });



    after(function (done) {
        /* TODO: DO it with batches */
        db.none("DROP TABLE users CASCADE")
            .then(function () {
                return db.none("DROP TABLE books CASCADE");
            })
            .then(function() {
                return db.none("DROP TABLE trades");
            })
            .then(function() {
                done();
            })
            .catch(function (error) {
                console.log(error);
            });
    });
});