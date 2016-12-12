'use strict';

//includes
var data = require('./user-data-access.js');
var apiHandler = require('../lib/wamp-api-access');

//init module variables
var api = {
    local: {
        uri: 'com.ssp.user',
        publishers: {
            updateUserList: function() {
                return getUsers();
            }
        },
        subscribers: {},
        registers: {
            register: register,
            unregister: unregister,
            login: login,
            logout: logout,
            isValidLogin: isValidLogin,
            isLoggedIn: isLoggedIn,
            getUsers: getUsers,
            getLoggedInUsers: getLoggedInUsers
        },
        callers: {}
    }
};

// api functions
function register(username, password) {
    if(!username || !password) throw['Username or password could not be empty!'];
    if(data.isUserRegistered(username)) throw['User is already registered!'];
    data.makeUserRegistered(username, password);
    console.log('INFO: registered: ', username);
    apiHandler.publish(api.local.uri, api.local.publishers.updateUserList);
    return true;
}

function unregister(username, password) {
    if (!data.isUserRegistered(username) || !data.isUserPasswordValid(username, password)) throw['Invalid request.'];
    data.makeUserUnregistered(username);
    console.log('INFO: user unregistered: ', username);
    apiHandler.publish(api.local.uri, api.local.publishers.updateUserList);
    return true;
}

function login(username, password) {
    var token;

    if(!data.isUserRegistered(username)) {
        throw ['No such a user!'];
    }
    if(data.hasUserToken(username)) {
        throw ['User is already logged in!'];
    }
    if (!data.isUserPasswordValid(username, password)) {
        throw ['Wrong password!'];
    }

    token = data.makeUserLoggedIn(username);
    console.log('INFO: user logged in: ', username);
    apiHandler.publish(api.local.uri, api.local.publishers.updateUserList);
    return token;
}

function logout(username, token) {
    if (!isValidLogin(username, token)) throw['Invalid request.'];
    data.makeUserLoggedOut(username);
    console.log('INFO: user logged out: ', username);
    apiHandler.publish(api.local.uri, api.local.publishers.updateUserList);
    return true;
}

function isValidLogin (username, token) {
    return data.isUserRegistered(username) && data.isUserTokenValid(username, token);
}

function isLoggedIn (username) {
    return data.isUserRegistered(username) && data.hasUserToken(username);
}

function getUsers() {
    return data.getUserList();
}

function getLoggedInUsers() {
    return data.getLoggedInUserList();
}

// invoke module
exports.main = function main() {
    console.log('INFO: module invoked: user-service');

    // connect and handling
    apiHandler.connect('ssp-game', 'ws://crossbar-service:8080/ws', function onOpenHandler() {
        console.log('INFO: connection opened.');
        apiHandler.processApiDescription(api);
        //apiHandler.publish(api.local.uri, api.local.publishers.updateUserList());
    }, function onCloseHandler(reason) {
        console.log('INFO: connection closed, beacuse:', reason);
    });
};

exports.shutdownHandler = function() {
    var error;
    if((error = apiHandler.close()) !== apiHandler.CONNECTION_CLOSED_SUCCESSFUL) {
        console.log('ERROR: The connection could not be closed gracefully:', error);
        process.exit(1);
    }
};

