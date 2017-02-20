/**
 * Provides a user data access wrapper. Keeps the business logic independent from the data access method.
 */
'use strict';

// includes
var crypto = require('crypto');
var has = Object.prototype.hasOwnProperty;

// init variables
var users = Object.create(null);
var tokenId = Math.floor(Math.random() * 100);
var tokenSalt = 'dflsdjfhsdsdfjl';

// helper registers
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

// data access registers
exports.hasUserToken = function hasUserToken(username) {
    return users[username].token !== undefined;
};

exports.isUserPasswordValid = function isUserPasswordValid(username, password) {
    return users[username].passwordHash === hashPassword(password);
};

exports.isUserTokenValid = function isUserTokenValid(username, token) {
    return users[username].token === token;
};

exports.isUserRegistered = function isUserRegistered(username) {
    return has.call(users, username);
};

exports.makeUserLoggedIn = function makeUserLoggedIn(username) {
    users[username].token = generateToken(username);
    return users[username].token;
};

exports.makeUserRegistered = function makeUserRegistered(username, password) {
    users[username] = {
        passwordHash: hashPassword(password),
        token: undefined,
        data: {}
    };
};

exports.makeUserUnregistered = function makeUserUnregistered(username) {
    delete(users[username]);
};

exports.makeUserLoggedOut = function makeUserLoggedOut(username) {
    users[username].token = undefined;
};

exports.getLoggedInUserList = function getLoggedInUserList() {
    return getUsers().filter(function (user) {
        return user.isLoggedIn;
    });
};

exports.convertUserDataPublic = function convertUserDataPublic(username) {
    return {
        username: username,
        isLoggedIn: users[username].token !== undefined,
        data: users[username].data
    };
};

exports.getUserList = function getUserList() {
    var userList = [];
    for (var username in users) {
        if (has.call(users, username)) {
            userList.push(exports.convertUserDataPublic(username));
        }
    }
    return userList;
};