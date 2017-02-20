'use strict';
/**
 * This service provides a user handler functions like registration, login, logout, unregistration
 * and different types of checks and integrations. In this module the business logic is described.
 *
 */
const APP_PREFIX = 'com.ssp';
const SERVICE_NAME = 'user';

const data = require('./user-data-access.js');
const log = require('../lib/log-handler.js').getLogger(SERVICE_NAME);
const apiHandler = require('./../lib/api/api');

var api = apiHandler.getApi({
    connectionDetails: {realm: 'ssp-game', url: 'ws://localhost:8080/ws', autoReconnect: true, maxRetries: 3},
    uriPrefix: `${APP_PREFIX}.${SERVICE_NAME}`,
});

api.add.error('credential_format_error', "The chosen username or password not meet the requirements.")
api.add.error('invalid_credentials', "The username or the password is invalid.");
api.add.error('user_already_exist', "The user with this username is already registered.");
api.add.error('user_not_exist', "This is not a registered username.");
api.add.error('already_logged_in', "This user is already logged in.")

/**
 * @apiDescription Returns the public data of all of the users.
 *
 * @api {publisher} /
 * @apiGroup user
 * @apiName updateUserList
 *
 */
api.add.publisher('updateUserList');

/**
 * @apiDescription  Register a new subscriber in the subscriber database.
 *
 * @api {callee} /
 * @apiGroup user
 * @apiName regsiter
 *
 * @apiParam {string} username A valid username to register, should not be falsy.
 * @apiParam {string} password A valid password, should not be falsy.
 * @apiSuccess {boolean} return always true if success
 * @apiError credential_format_error
 * @apiError user_already_exist
 */
var register = (username, password) => {
    if(!username || !password) { throw api.error.credential_format_error() }
    if(data.isUserRegistered(username)) { throw api.error.user_already_exist() }

    data.makeUserRegistered(username, password);
    log.info('User registered: %s', username);
    api.publish.updateUserList(data.getUserList());
    return true;
};
api.add.callee('register', register);

/**
 * @apiDescription Removes a username from a user database.
 *
 * @api {callee} /
  *@apiGroup user
 *
 * @apiParam {string} username An already registered username.
 * @apiParam {string} password A password belongs to the username.
 * @apiSuccess {boolean} return true, if the unregistration is success.
 * @apiError user_not_exist
 * @apiError invalid_credentials
 */
var unregister = (username, password) => {
    if (!data.isUserRegistered(username)) { throw api.error.user_not_exist() }
    if (!data.isUserPasswordValid(username, password)) { throw api.error.invalid_credentials() }

    data.makeUserUnregistered(username);
    log.info('User is unregistered: %s', username);
    api.publish.updateUserList(data.getUserList());
    return true;
};
api.add.callee('unregister', unregister);

/**
 * Give a user a logged in status by generating a token to it. With this token a user can validate any
 * login while not logged out.
 *
 * @param {string} username - An already registered username to log in.
 * @param {string} password - A password which the user is registered.
 * @returns {string} A token belongs to the user login.
 * @throws user_not_exist
 * @throws already_logged_in
 * @throws invalid_credentials
 *
 */
var login = (username, password) => {
    var token;

    if (!data.isUserRegistered(username)) { throw api.error.user_not_exist(); }
    if (data.hasUserToken(username)) { throw api.error.already_logged_in(); }
    if (!data.isUserPasswordValid(username, password)) { throw api.error.invalid_credentials() }

    token = data.makeUserLoggedIn(username);
    log.info('User login: ', username);
    api.publish.updateUserList(data.getUserList());
    return token;
};
api.add.callee('login', login);

/**
 * Set a user state in a user database to logged out by removing its token.
 *
 * @param {string} username An already registered username in a user database.
 * @param {string} token A valid session token for a user.
 * @returns {boolean} true if the logout procedure successful.
 * @throws invalid_credentials
 */
var logout = (username, token) => {
    if (!isValidLogin(username, token)) { throw api.error.invalid_credentials(); }
    data.makeUserLoggedOut(username);
    log.info('User logout: %s', username);
    api.publish.updateUserList(data.getUserList());
    return true;
};
api.add.callee('logout', logout);

/**
 * Examine that the given user registered and have a valid session token.
 *
 * @param {string} username A username to check.
 * @param {string} token A session token to check.
 * @returns {boolean} returns true if the user is registered and logged in with a valid token.
 */
var isValidLogin = (username, token) => {
    return data.isUserRegistered(username) && data.isUserTokenValid(username, token);
};

/**
 * Examine that the user has a session token, but not checks, that it is valid or not.
 * Useful for status checking, when listing users and the token to check is not known.
 *
 * @param {string} username A username to check.
 * @returns {boolean} returns true, if the user is registered and has a session token.
 */
var isLoggedIn = (username) => {
    return data.isUserRegistered(username) && data.hasUserToken(username);
};
api.add.callee('isLoggedIn', isLoggedIn);

/**
 * Returns the public data of all of the users.
 *
 * @function getUsers
 * @return {Array<publicUserData>}
 */
var getUsers = function getUsers() {
    return data.getUserList();
};
api.add.callee('getUsers', getUsers)

/**
 * Returns the public data of the logged in users.
 *
 * @function getLoggedInUsers
 * @return {Array<publicUserData>}
 */
var getLoggedInUsers = function getLoggedInUsers() {
    return data.getLoggedInUserList();
};
api.add.callee('getLoggedInUsers', getLoggedInUsers);

exports.main = () => {
    log.info('Service started: %s', SERVICE_NAME);

    // connect and handling
    api.connect(() => {
        log.info('Connected to the WAMP router.');
        api.registerAll().then( (results) => {
            results.forEach((result) => { log.info('Service registered:', result) });
        }).catch((error) => {
            log.error('Error during service registration', error)
        });
    }, (reason) => {
        log.warn('Connection closed, the reason: ', reason);
    }, (error) => {
        log.error('Error during the connection.');
    });
};

exports.shutdownHandler = () => {
    api.disconnect();
    api.info('Shut down signal received, disconnecting...')
};
