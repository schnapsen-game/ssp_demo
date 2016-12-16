/**
 *  This service provides a user handler functions like registration, login, logout, unregistration
 *  and different types of checks and integrations. In this module the business logic is described.
 *
 *  @module user
 */
'use strict';

/**
 * @requires user-data-access.js - The mapper to the user data handler.
 * @ignore
 * */
var data = require('./user-data-access.js');

/**
 * @requires /lib/wamp-api-access.js - The mapper to the WAMP protocol handler.
 * @ignore
 */
var apiHandler = require('../lib/wamp-api-access.js');

/**
 * @requires /lib/log-handler.js - A logger mapper.
 * @ignore
 */
var log = require('../lib/log-handler.js').getLogger();

var serviceName='user-service';

/**
 * @var {object} api - A general WAMP API descriptor
 * @ignore
 */
var api = {
    local: {
        prefix: 'com.ssp.user.',
        publishers: {},
        subscribers: {},
        registers: {},
        callers: {}
    }
};

/* API functions */

/**
 * Returns the public data of all of the users.
 *
 * @api topic.publisher
 *
 * @function updateUserList
 * @return {Array<publicUserData>}
 */
api.local.publishers.updateUserList = function () {
    return data.getUserList();
};

/**
 * Register a new subscriber in the subscriber database.
 *
 * @api procedure.register
 *
 * @function register
 * @param {string} username - A valid username to register, should not be falsy.
 * @param {string} password - A valid password, should not be falsy.
 * @returns {boolean} always true if success
 * @throws 'The username or the password is invalid'
 * @throws 'User already registered'
 */
api.local.registers.register = function (username, password) {
    if(!username || !password) { apiThrows('The username or the password is invalid!'); }
    if(data.isUserRegistered(username)) { apiThrows('User is already registered!'); }

    data.makeUserRegistered(username, password);
    log.info('User registered: %s', username);
    apiHandler.publish(api.local.prefix, api.local.publishers.updateUserList);
    return true;
};

/**
 * Removes a username from a user registration database.
 *
 * @api procedure.register
 *
 * @function unregister
 * @param {string} username An already registered username.
 * @param {string} password A password belongs to the username.
 * @returns {boolean} true, if the unregistrtation success.
 * @throws 'The user is not registered.'
 * @throws 'Invalid credentials.'
 */
api.local.registers.unregister = function unregister(username, password) {
    if (!data.isUserRegistered(username)) { apiThrows('The user is not registered.'); }
    if (!data.isUserPasswordValid(username, password)) { apiThrows('Invalid credentials.');}

    data.makeUserUnregistered(username);
    log.info('User is unregistered: %s', username);
    apiHandler.publish(api.local.prefix, api.local.publishers.updateUserList);
    return true;
};

/**
 * Give a user a logged in status by generating a token to it. With this token a user can validate any
 * login while not logged out.
 *
 * @api procedure.register
 *
 * @function login
 * @param {string} username - An already registered username to log in.
 * @param {string} password - A password which the user is registered.
 * @returns {string} A token belongs to the user login.
 * @throws 'The user is not registered'
 * @throws 'User is already logged in!'
 * @throws 'Invalid credentials.'
 *
 */
api.local.registers.login = function (username, password) {
    var token;

    if (!data.isUserRegistered(username)) { apiThrows('The user is not registered'); }
    if (data.hasUserToken(username)) { apiThrows('User is already logged in!'); }
    if (!data.isUserPasswordValid(username, password)) { apiThrows('Invalid credentials.'); }

    token = data.makeUserLoggedIn(username);
    log.info('User login: ', username);
    apiHandler.publish(api.local.prefix, api.local.publishers.updateUserList);
    return token;
};

/**
 * Set a user state in a user database to logged out by removing its token.
 *
 * @api procedure.register
 *
 * @function logout
 * @param {string} username An already registered username in a user database.
 * @param {string} token A valid session token for a user.
 * @returns {boolean} true if the logout procedure successful.
 * @throws 'Invalid credentials.'
 */
api.local.registers.logout = function (username, token) {
    if (!isValidLogin(username, token)) { apiThrows('Invalid credentials.'); }
    data.makeUserLoggedOut(username);
    log.info('User logout: %s', username);
    apiHandler.publish(api.local.prefix, api.local.publishers.updateUserList);
    return true;
};

/**
 * Examine that the given user registered and have a valid session token.
 *
 * @api procedure.register
 *
 * @function isValidLogin
 * @param {string} username A username to check.
 * @param {string} token A session token to check.
 * @returns {boolean} returns true if the user is registered and logged in with a valid token.
 */
api.local.registers.isValidLogin = function (username, token) {
    return data.isUserRegistered(username) && data.isUserTokenValid(username, token);
};

/**
 * Examine that the user has a session token, but not checks, that it is valid or not.
 * Useful for status checking, when listing users and the token to check is not known.
 *
 * @api procedure.register
 *
 * @function isLoggedIn
 * @param {string} username A username to check.
 * @returns {boolean} returns true, if the user is registered and has a session token.
 */
api.local.registers.isLoggedIn = function (username) {
    return data.isUserRegistered(username) && data.hasUserToken(username);
};

/**
 * Returns the public data of all of the users.
 *
 * @api procedure.register
 *
 * @function getUsers
 * @return {Array<publicUserData>}
 */
api.local.registers.getUsers = function () {
    return data.getUserList();
};

/**
 * Returns the public data of the logged in users.
 *
 * @api procedure.register
 *
 * @function getLoggedInUsers
 * @return {Array<publicUserData>}
 */
api.local.registers.getLoggedInUsers = function () {
    return data.getLoggedInUserList();
};

// helper function
/**
 * @ignore
 * @param message
 */
function apiThrows(message) {
    log.error('API error: %s', message);
    apiHandler.error(api.local.prefix + '.error', [message], {});
}

// invoke service
/**
 * Provides a function to start a service to a service handler.
 * @ignore
 */
exports.main = function main() {
    log.info('Service started: %s', serviceName);

    // connect and handling
    apiHandler.connect('ssp-game', 'ws://crossbar-service:8080/ws', function onOpenHandler() {
        log.info('Connected to the WAMP router.');
        apiHandler.processApiDescription(api);
        //apiHandler.publish(api.local.prefix, api.local.publishers.updateUserList());
    }, function onCloseHandler(reason) {
        log.warn('Connection closed, the reason: ', reason);
    });
};

/**
 * Provides a shutdown handler towards the service handler. This function is called,
 * when an external signal directs the service to a graceful shutdown.
 * @ignore
 */
exports.shutdownHandler = function() {
    var error;
    if((error = apiHandler.close()) !== apiHandler.CONNECTION_CLOSED_SUCCESSFUL) {
        log.crit('The connection could not be closed gracefully:', error);
        process.exit(1);
    }
};
