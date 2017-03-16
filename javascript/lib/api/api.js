'use strict';
const w3cWebsockerHandler = require('websocket').w3cwebsocket; // required for wampy
const wampProtocolHandler = require('wampy');
const log = require('./../log-handler').getLogger('api');
const debug = require('./../log-handler').getDebugger('api');

const {ApiError, WampError, ProtocolError} = require('./api-error');
const {has, isObject, forEachOnObject, isArray, mergeObjects} = require('./../utils/object');

var getApi = (options = {}, baseService) => {
    var _baseService = baseService || null;
    var _connection = null;
    var _options = {
        connectionDetails: null,
        uriPrefix: null,
    };

    _options = mergeObjects(options, _options);

    var _hasActiveSession = () => {
        return isObject(_connection) && _connection.getSessionId();
    };

    var _addPrefix = (uri) => {
        if (_options.uriPrefix) {
            return `${_options.uriPrefix}.${uri}`;
        } else {
            return uri;
        }
    };

    /**
     * Returns a function which able to register the RPC callee role to the WAMP dealer.
     *
     * @param {String} uri: The WAMP uri to register as an RPC handler. The uri prefix will be applied to it.
     * @param {function(...args)} handler - The handler function can be called with any arguments, WAMP argsList will be used from the
     *  INVOCATION message, the argsDict will be ignored. The handler's result is encapsulated into the argsDict's
     *  result property of the YIELD WAMP message. If a ProtocolError error has been thrown in the RPC body, it will be
     *  transported transparently through the WAMP channel, and it will be received as an ERROR message by a caller. If any
     *  other type of error has been thrown (including runtime errors like TypeError), the message will be logged as an error
     *  loglevel, and a generic 'error.internal_server_error' error will sent back to the caller hiding the unexpected error's
     *  sensitive details from the client (like stack trace).
     * @return {function():Promise<uri, ProtocolError>} -
     *  This function is responsible for the async registration of the RPC handler in the callee role for the uri. When called it
     *  will be return a Promise, which is fulfilled if the registration is successful with the WAMP Dealer, or rejected
     *  if the registration is failed. The fulfilled handler will got the registration uri as a value, the reject handler
     *  will return a ProtocolError.
     * @provate
     */
    var calleeFactory = function (uri, handler) {

        // returns a function, which responsible for the async RPC handler registration procedure.
        return function registrationHandler() {
            return new Promise ((resolve, reject) => {
                if(!_hasActiveSession()) {
                    reject(new ProtocolError('error.no_active_session', 'No active session to the message broker.'))
                }

                //calls the internal WAMP libs's register function
                _connection.register(uri, {
                    rpc: function rpcHandler(argsList, argsDict, options) {

                        //handle the errors throw by the RPC function
                        try {
                            var result = handler.apply(null, argsList);
                        } catch(e) {
                            // the throw error here will be sent back to the client, wampy uses the properties of the
                            //  given WampError.
                            if(e instanceof ProtocolError) {
                                throw new WampError(e.code, {}, [e.message], e.details);
                            } else {
                                log.error(`Error thrown in the RPC callback ${uri}, message: ${e}`);
                                throw new WampError(_addPrefix('error.internal_server_error'), {}, ['Internal Server Error.'], {});
                            }
                        }
                        return [{}, {result}];
                    },
                    onSuccess: () => { resolve(uri); },
                    onError: (error, details) => {
                        reject(new ProtocolError(error, error, details))
                    }
                }, {exclude_me: false});

            })
        };
    };

    /**
     * Create a function which able to handle the remote procedure calls (RPCs) caller role.
     *
     * @param {String} WAMP uri to used for the later call of the function.
     * @return {function(...args): Promise<argsDict.result, ProtocolError>} - A function to initiate an RPC to the WAMP dealer.
     *  The function can be called any arguments (depends on how the callee is defined). The arguments will be spread
     *  as an array and will pass through with a WAMP argList parameter in the WAMP CALL message. The promise will be
     *  resolve as a return value from the callee from the WAMP RESULT message. The function extract the given value,
     *  from the argsDict object's result property. So the returning argsList, and other properties of argsDict will be
     *  ignored! In a case of an error (can be a WAMP dealer error, or an application level error in the callee code),
     *  a ProtocolError will be thrown, the user message will be constructed from the argsList by join.
     */
    var callerFactory = function(uri) {
        return function callerHandler() {
            var calledArguments = arguments;

            return new Promise( function (resolve, reject) {
                if(!_hasActiveSession()) {
                    reject(new ProtocolError('error.no_active_session', 'No active session to the message broker.'))
                }

                _connection.call(uri, [...calledArguments], {
                    onSuccess: (resultList, resultDict) => {
                        if(resultDict && has.call(resultDict, 'result')) {
                            resolve(resultDict.result);
                        } else {
                            resolve(null);
                        }
                    },
                    onError: (uri, details, errorList, errorDict) => {
                        reject(new ProtocolError(uri, errorList.join(' '), errorDict));
                    }
                });
            });
        };
    };

    /**
     * Returns a function, witch able to create a new ProtocolError with a given uri and default message. When the function
     * is called a custom details object can be passed to it.
     *
     * @param {String} uri - the unique error identifier
     * @param {String} message - the human readable message
     * @return {function(details: object):{ProtocolError}} - A function creates a new instance of a ProtocolError with
     *  the given custom details object and the prebaked uri and message params.
     */
    var errorFactory = function(uri, message) {
        return function errorHandler(details) {
            return new ProtocolError(uri, message, details);
        }

    };

    /**
     * Returns a function which handle the message publishes.
     *
     * @param {String} uri - A WAMP uri, a channel where the data is published.
     * @return {function(data):Promise<uri|ProtocolError>} - A function which initiate an async PUBLISH message towards the
     *  WAMP broker. The data can be anything, it will be encapsulated into the argsDict.result property of the message.
     *  If more than one argument is given, they will be sent as an array within the argsDict.result. If no arguments is given,
     *  an argsDict.result=null will be sent through. A returned promise will be resolved with the uri if the pulication is
     *  successful, or rejected with a ProtocolError, constructed from the WAMP ERROR message or the under laying API.
     */
    var publisherFactory = function(uri) {
        return function publishHandler() {
            var publishArguments = arguments;
            return new Promise( function (resolve, reject) {
                if(!_hasActiveSession()) {
                    reject(new ProtocolError('error.no_active_session', 'No active session to the message broker.'))
                }
                var result;
                if (publishArguments.length === 1) {
                    result = publishArguments[0];
                } else if (publishArguments.length > 1) {
                    result = [...publishArguments];
                } else if (publishArguments.length === 0) {
                    result = undefined;
                }
                _connection.publish(uri, {result}, {
                    onSuccess: () => { resolve(uri); },
                    onError: (error, details) => { reject(new ProtocolError(error, error, details)) }
                }, {exclude_me: false});
            });
        };
    };
    /*


    */

    /**
     * Returns a function to handle the handler subscription to an uri in a PUBSUB model.
     *
     * @param {String} uri - A WAMP uri to subscribe for.
     * @param {function (argsDict.result)} handler - The handler function, will be called, when an EVENT is received on
     *  a given uri. The WAMP EVENT message argsDict.result will be passed as an argument or undefined if this property
     *  is not exists.
     * @return {function():Promise<uri, ProtocolError>} - Function responsible for the async subscription of the handler towards
     *  the WAMP broker. If the registration successful, the promise will be resolved with uri, if it is failed by the
     *  WAMP broker or the under laying protocol handler, rejected with a ProtocolError.
     */
    var subscriberFactory = function (uri, handler) {
        return function subscriberHandler() {
            return new Promise ((resolve, reject) => {
                if(!_hasActiveSession()) {
                    reject(new ProtocolError('error.no_active_session', 'No active session to the message broker.'))
                }
                _connection.subscribe(uri, {
                    onSuccess: () => { resolve(uri); },
                    onError: (error, details) => { reject(new ProtocolError(error, error, details)) },
                    onEvent: (argsList, argsDict) => {
                        var result;
                        if (argsDict && has.call(argsDict, 'result')) {
                            result = argsDict.result;
                        }
                        handler(result);
                    }
                });
            })
        };
    };

    var _api = {
        register: {},
        call: {},
        publish: {},
        subscribe: {},
        error: {},
        add: {
            callee: function (uri, handler) {
                var prefixedUri = _addPrefix(uri);
                if (has.call(_api.register, prefixedUri)) {
                    throw new ApiError(`The uri already added as a callee: ${prefixedUri}`);
                }
                _api.register[uri] = calleeFactory(prefixedUri, handler);
            },
            caller: function (uri) {
                var prefixedUri = _addPrefix(uri);
                if (has.call(_api.call, prefixedUri)) {
                    throw new ApiError(`The uri already added as a caller: ${prefixedUri}`);
                }
                _api.call[uri] = callerFactory(prefixedUri);
            },
            publisher: function (uri) {
                var prefixedUri = _addPrefix(uri);
                if (has.call(_api.publish, prefixedUri)) {
                    throw new ApiError(`The uri already added as a publisher: ${prefixedUri}`);
                }
                _api.publish[uri] = publisherFactory(prefixedUri);
            },
            subscriber: function (uri, handler) {
                var prefixedUri = _addPrefix(uri);
                if (has.call(_api.subscribe, prefixedUri)) {
                    throw new ApiError(`The uri already added as a subscriber: ${prefixedUri}`);
                }
                _api.subscribe[uri] = subscriberFactory(prefixedUri, handler);
            },
            error: function (uri, message) {
                var prefixedUri = _addPrefix(uri);
                if (has.call(_api.error, prefixedUri)) {
                    throw new ApiError(`The uri already added as an error: ${prefixedUri}`);
                }
                _api.error[uri] = errorFactory(prefixedUri, message);
            }
        },
        registerAll: () => {
            var promises = [];
            forEachOnObject(_api.register, (key, handler) => {
                promises.push(handler());
            });
            return Promise.all(promises);
        },
        subscribeAll: () => {
            var promises = [];
            forEachOnObject(_api.subscribe, (key, handler) => {
                promises.push(handler());
            });
            return Promise.all(promises);
        },
        connect: function (onOpen, onClose, onError) {
            if(!_connection
                && _baseService
                && has.call(_baseService, 'getConnectionInstance')
                && typeof _baseService.getConnectionInstance == 'function'
            ) {
                _connection = _baseService.getConnectionInstance();

                if(!_hasActiveSession()) {
                    _connection.connect();
                }
                return;
            }

            if(_connection && !_hasActiveSession()) {
                _connection.connect();
                return;
            }

            _connection = new wampProtocolHandler(_options.connectionDetails.url, {
                realm: _options.connectionDetails.realm,
                ws: w3cWebsockerHandler,
                autoReconnect: _options.connectionDetails.autoReconnect || true,
                maxRetries: _options.connectionDetails.maxRetries || 3,
                onConnect: onOpen,
                onClose: onClose,
                onError: onError,
                onReconnect: () => { log.warn('Reconnecting...') },
                onReconnectSuccess: () => { log.info('Reconnection successful.') }
            });

        },
        getConnectionInstance: () => {
            return _connection;
        },
        disconnect: () => {
            _connection.disconnect();
        }
    };
    return _api;
};

module.exports = {getApi};