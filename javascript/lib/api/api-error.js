'use strict';

/**
 * A general error thrown by an API module.
 * @param message
 * @param code
 * @param details
 * @constructor
 */
function ApiError(message, code, details) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.message = message;
    this.details = details;
}
require('util').inherits(ApiError, Error);

/**
 * A normalized error can be thrown or catched in the application code. The specific protocols values can be mapped to
 * this error's properties, so the application code can be independent from the protocol specific error handling.
 *
 * @param {String|Number} [code = 'unspecified.error']: A unique code for the error, machine readable.
 * @param {String} [message = 'Unspecified error']: A human readable message.
 * @param {Object} [details = {}]: A details object, when custom properties can be given.
 * @constructor
 */
function ProtocolError(code = 'unspecified.error', message = 'Unspecified error.', details = {}) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.message = message;
    this.details = details;
}
require('util').inherits(ProtocolError, Error);


/**
 * General WAMP error, maps the WAMP ERROR message properties to a JS Error. Useful for client side error
 * reporting and examination from the received WAMP ERROR message.
 *
 * @param {String} [uri = 'unspecified.error'] : the error uri, should be a valid WAMP uri.
 * @param {Object} [details = {}]: the given details object, used for extending the protocol in the future. Not send to the remote end.
 * @param {Array} [argsList = []]: application defined error arguments. Send / receive from / to the remote end.
 * @param {Object} [argsDict = {}]: application defined error arguments. Send / receive from / to the remote end.
 * @constructor:
 */
function WampError(uri = 'unspecified.error', details = {}, argsList = [], argsDict = {}) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.uri = uri;
    this.details = details;
    this.argsList = argsList;
    this.argsDict = argsDict;
}
require('util').inherits(WampError, Error);

module.exports = {ApiError, WampError, ProtocolError};