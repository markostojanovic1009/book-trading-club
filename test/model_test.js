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
               return User.getUserId("nonexistent").should.be.rejected.and.should.eventually.have.property(
                   'message', 'Username nonexistent not found.');
            });
        });

    });

    after(function (done) {
        /* TODO: DO it with batches */
        db.none("DROP TABLE users")
            .then(function() {
                done();
            })
            .catch(function (error) {
                console.log(error);
            });
    });
});