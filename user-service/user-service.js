'use strict';
var autobahn = require('autobahn');
var crypto = require('crypto');
var has = Object.prototype.hasOwnProperty;

var users = {};
var api = {};
var tokenId = Math.floor(Math.random() * 100);
var tokenSalt = 'dflsdjfhsdsdfjl';
var localSession = undefined;

// interface functions
api.login = function login(username, password) {
    if(!isRegistered(username)) {
        throw ['No such a user!'];
    }
    if(users[username].token !== undefined) {
        throw ['User is already logged in!'];
    }
    if (users[username].passwordHash !== hashPassword(password)) {
        throw ['Wrong password!'];
    }

    // login the user
    users[username].token = generateToken(username);
    console.log('INFO: user logged in: ', username, users[username].token);
    localSession.publish('com.ssp.user.channel.updateUserList', api.getUsers());
    return users[username].token;
};

api.register = function register(username, password) {
    if(!username || !password) throw['Username or password could not be empty!'];
    if(isRegistered(username)) throw['User is already registered!'];

    users[username] = {
        passwordHash: hashPassword(password),
        token: undefined,
        data: {}
    };
    console.log('INFO: registered: ', username);
    localSession.publish('com.ssp.user.channel.updateUserList', api.getUsers());
    return true;
};

api.logout = function logout(username, token) {
    if (!api.isValidLogin(username, token)) throw['Invalid request.'];
    users[username].token = undefined;
    console.log('INFO: user logged out: ', username);
    localSession.publish('com.ssp.user.channel.updateUserList', api.getUsers());
    return true;
};

api.unregister = function unregister(username, password) {
    if (!isRegistered(username) || users[username].passwordHash !== hashPassword(password)) throw['Invalid request.'];
    delete(users[username]);
    console.log('INFO: user unregistered: ', username);
    localSession.publish('com.ssp.user.channel.updateUserList', api.getUsers());
    return true;
};

api.isValidLogin = function isValidLogin (username, token) {
    return has.call(users, username) && users[username].token === token;
};

api.getUsers =function getUsers() {
    var userList = [];
    for(var username in users) {
        if(has.call(users, username)) {
            userList.push({
                username: username,
                isLoggedIn: users[username].token !== undefined,
                data: users[username].data
            });
        }
    }
    return userList;
};

api.getLoggedInUsers = function getLoggedInUsers() {
    return getUsers().filter(function (user) {
       return user.isLoggedIn;
    });
};

// helper functions
function isRegistered(username) {
    return has.call(users, username);
}

function generateToken(username) {
    tokenId++;
    var hash = crypto.createHash('sha256');
    hash.update(username + String(tokenSalt) + String(tokenId));
    return hash.digest('hex');
}

function hashPassword(password) {
    var hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}

// connection and service registration
var connection = new autobahn.Connection({
    url: "ws://127.0.0.1:8080/ws",
    realm: "ssp-game"
});

connection.onopen =  function (session) {
    localSession = session;
    console.log('INFO: connected to the crossbar service.');
    localSession.publish('com.ssp.user.channel.updateUserList', api.getUsers());

    //register all the RPC API function
    for(var apiFunction in api) {
        (function(localApiFunction) {
            if (has.call(api, localApiFunction)) {
                session.register('com.ssp.user.rpc.' + String(localApiFunction), function (args) {
                    return api[localApiFunction].apply(null, args);
                }).then(
                    function () {
                        console.log('INFO: registered rpc function:', localApiFunction);
                    },
                    function (error) {
                        console.log('ERROR: could not be registered the following rpc function', localApiFunction, error);
                    }
                );
            }
        })(apiFunction);
    }
};

connection.onclose = function (reason) {
    console.log('INFO: connection to the crossbar service is closed: ', reason);
};

connection.open();


// keep the service alive
function waiting() {
    //console.log('tick');
    setTimeout(waiting, 3000);
}
setTimeout(waiting, 3000);
