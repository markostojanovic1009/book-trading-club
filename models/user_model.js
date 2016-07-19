var bcrypt = require('bcryptjs');
var db = require('./database');


/* Error types:
 * 1000 - Account creation error
 */
const ACCOUNT_CREATION_ERROR_CODE = 1000;
const USERNAME_NOT_FOUND_CODE = 4000;
const ACCOUNT_AUTHENTICATION_ERROR_CODE = 4001;
const EMAIL_EXISTS_CODE = 4005;
const INTERNAL_DATABASE_ERROR_CODE = 5000;
const SUCCESSFUL_OPERATION = 6000;

var usernameNotFoundError = function(wrongUsername) {
    return {
        code: USERNAME_NOT_FOUND_CODE,
        message: "Username " + wrongUsername + " not found."
    };
};

var internalDatabaseError = function() {
    return {
        code: INTERNAL_DATABASE_ERROR_CODE,
        message: "An error occured. Please try again later."
    };
};

/* All errors return an error object
 * errorObj {
 *   code: Integer,
 *   message: String
 * }
 * Where code describes the type of problem that occurred and
 * message is a message that should be returned to the user directly.
 */
var verifyUsername = function(username) {
    var errorObj = {
        code: ACCOUNT_CREATION_ERROR_CODE
    };
    if(!username) {
        errorObj.message = "Username missing.";
    } else if(username.length < 5) {
        errorObj.message = "Username must be at least 5 characters long.";
    } else if(username.length > 30) {
        errorObj.message = "Username must be less than 30 characters long.";
    }
    var forbiddenSimbols = /[^A-Za-z0-9]/;
    if(forbiddenSimbols.test(username)) {
        errorObj.message = "Username must only contain letters and numbers.";
    }
    if(errorObj.message) {
        return errorObj;
    } else {
        return null;
    }
};

var verifyPassword = function(password) {
    var errorObj = {
        code: ACCOUNT_CREATION_ERROR_CODE
    };
    if(!password) {
        errorObj.message = "Password missing.";
    } else if(password.length < 8) {
        errorObj.message = "Password must be at least 8 characters long.";
    } else if(password.length > 50) {
        errorObj.message = "Password be less than 50 characters long.";
    }
    var forbiddenSimbols = /[^A-Za-z0-9]/;
    if(forbiddenSimbols.test(password)) {
        errorObj.message = "Password must only contain letters and numbers.";
    }
    if(errorObj.message) {
        return errorObj;
    } else {
        return null;
    }
};

var verifyEmail = function(email) {
    var errorObj = {
        code: ACCOUNT_CREATION_ERROR_CODE
    };
    if(!email) {
        errorObj.message = "Email missing.";
    }
    var format = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!format.test(email)) {
        errorObj.message = "Please enter a valid email address.";
    }
    if(errorObj.message) {
        return errorObj;
    } else {
        return null;
    }
};

/* Inserts the user into the database.
 * Performs basic validity checks before calling the database.
 * Password is hashed and salted with bcryptjs.
 */
var addUser = function(username, password, email) {

    var userValidationError = verifyUsername(username);
    var passwordValidationError = verifyPassword(password);
    var emailValidationError = verifyEmail(email);
    if (userValidationError || passwordValidationError || emailValidationError) {
        console.log(userValidationError || passwordValidationError || emailValidationError);
        return Promise.reject(userValidationError || passwordValidationError || emailValidationError);
    }

    var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

    return new Promise(function (resolve, reject) {
        db.one("INSERT INTO users(username, hash, email) VALUES($1, $2, $3) returning username, email", [username, hash, email])
            .then(function (data) {
                resolve(data);
            })
            .catch(function (error) {

                if(error.code == "23505") {

                    var errorMessage = {
                        code: ACCOUNT_CREATION_ERROR_CODE
                    };

                    if(error.constraint === "users_username_key") {
                        errorMessage.message = "Username " + username + " already exists.";
                    } else if (error.constraint === "users_email_key") {
                        errorMessage.message = "Email " + email + " already in use.";
                    }

                    reject(errorMessage);

                } else {
                    console.log("Internal database error: ", error);
                    reject(internalDatabaseError());
                }
            });
    });
};

var getUser = function(username) {
    return new Promise(function(resolve, reject) {
        db.oneOrNone("SELECT username, email FROM users WHERE username=$1", [username])
            .then(function(data) {
                if(data) {
                    resolve(data);
                } else {
                    reject(usernameNotFoundError(username));
                }
            })
            .catch(function(error) {
                console.log("Internal database error: ", error);
                reject(internalDatabaseError());
            });
    });
};

var updateUser = function (user) {
    return new Promise(function(resolve, reject) {
        getUser(user.username)
            .then(function(data) {
                return db.none("UPDATE users SET email=$2 WHERE username=$1", [user.username, user.email]);
            })
            .then(function() {
                resolve();
            })
            .catch(function(error) {
                if(error.code == "23505") {
                    if(error.constraint == "users_email_key") {
                        reject({
                            code: EMAIL_EXISTS_CODE,
                            message: "Email " + user.email + " already in use."
                        });
                    }

                } else if (error.code == USERNAME_NOT_FOUND_CODE) {
                    reject(error);
                } else {
                    reject(internalDatabaseError());
                }
            });
    });
};

var getUserId = function(username) {
  return new Promise(function(resolve, reject) {
      db.oneOrNone("SELECT id FROM users WHERE username=$1", [username])
          .then(function (data) {
              if(data)
                resolve(data.id);
              else
                  reject(usernameNotFoundError(username));
          })
          .catch(function (error) {
              console.log(error);
              reject(internalDatabaseError());
          });
  });
};

/* Bcryptjs doesn't support Promises until version 2.4.0
 * which isn't out yet. I'm doing it synchronously now. I'll update
 * it to use Promises once 2.4.0 is out.
 */
var verifyUser = function(username, password) {
    return new Promise(function(resolve, reject) {
        db.oneOrNone("SELECT hash FROM users WHERE username=$1", [username])
            .then(function(data) {
                if(data) {
                    if (bcrypt.compareSync(password, data.hash)) {
                        resolve({
                            username: username
                        });
                    } else {
                        reject({
                            code: ACCOUNT_AUTHENTICATION_ERROR_CODE,
                            message: "Wrong username or password."
                        });
                    }
                } else {
                    reject({
                        code: ACCOUNT_AUTHENTICATION_ERROR_CODE,
                        message: "Wrong username or password."
                    });
                }
            })
            .catch(function(error) {
                console.log(error);
                reject(internalDatabaseError());
            });
    });
};

module.exports = {
    addUser : addUser,
    getUser: getUser,
    updateUser: updateUser,
    getUserId: getUserId,
    verifyUser: verifyUser
};