'use strict';

// includes
var has = Object.prototype.hasOwnProperty;
var autobahn = require('autobahn');

// module variables
var connection = undefined;

function createPropertyChain(object, properties) {
    var newProperty;
    if (properties.length < 1 || !isObject(object) || !Array.isArray.call(null, properties) ) {
        return object;
    }
    newProperty = properties.shift();
    if(!has.call(object, newProperty)) {
        object[newProperty]={};
    }
    return createPropertyChain(object[newProperty], properties);
}

function forEachOnObject (object, handler) {
    var property;
    for(property in object) {
        (function inLoop(localProperty){
            if(has.call(object, localProperty)) {
                return handler.call(null, localProperty, object[localProperty]);
            }
        })(property)
    }
}

function isObject(object) {
    return typeof object == 'object' && object !== null;
}

// api handlers
exports.registerDictionary = function (servicePrefix, dictionary) {
    forEachOnObject(dictionary, function inLoopHandler(name, handler) {
        exports.register(servicePrefix, handler).then(function success() {
            console.log('INFO: service registered: ', servicePrefix + name);
        }, function error(error) {
            console.log('ERROR: service could not be registered', servicePrefix + name, ' because: ', error);
        });
    });
};

exports.subscribeDictionary = function (servicePrefix, dictionary) {
    forEachOnObject(dictionary, function inLoopHandler(name, handler) {
        exports.subscribe(servicePrefix, handler).then(function success() {
            console.log('INFO: service subscribed: ', servicePrefix + name);
        }, function error(error) {
            console.log('ERROR: service could not be subscribed', servicePrefix, name, ' because: ', error);
        });
    });
};

exports.processApiDescription = function (api) {
    forEachOnObject(api, function inLoopHandler(serviceName, service) {
        exports.registerDictionary(service.prefix, service.registers);
        exports.subscribeDictionary(service.prefix, service.subscribers);
    });
};

// interface handlers
exports.publish = function (servicePrefix, handler, callingArgs) {
    var args = undefined, kwargs = undefined;
    var topic = servicePrefix + handler.name;
    var data = handler.apply(null, callingArgs);
    if (isObject(data) && Array.isArray(data)) {
        args = data;
    } else {
        kwargs = data;
    }
    console.log('publish invoked', topic, args, kwargs);
    return connection.session.publish(topic, args, kwargs);
};

exports.register = function (servicePrefix, handler) {
    return connection.session.register(servicePrefix + handler.name, function registerHandler(args)  {
        return handler.apply(null, args);
    });
};

exports.subscribe = function subscribe(servicePrefix, handler) {
    return connection.session.subscribe(servicePrefix + handler.name, function registerHandler(args)  {
        return handler.apply(null, args);
    });
};

exports.remoteCall = function remoteCall(servicePrefix, handler, callingArgs) {
    var args = undefined, kwargs = undefined;
    var topic = servicePrefix + handler.name;
    var data = handler.apply(null, callingArgs);
    if (isObject(data) && Array.isArray(data)) {
        args = data;
    } else {
        kwargs = data;
    }
    return connection.session.call(topic, args, kwargs);
};

exports.connect = function connect(realm, uri, onOpen, onClose) {
    connection = new autobahn.Connection({
        url: uri,
        realm: realm
    });

    connection.onopen = function onOpenHandler() {
        onOpen.call(null);
        console.log(connection.session.registrations);
    };
    connection.onclose = function onCloseHandler(reason) {
        onClose.call(null, reason);
    };
    return connection.open();
};

exports.close = function close() {
    return connection.close();
};

exports.error = function error(errorUri, message, errorObject) {
    message = message || [];
    errorObject = errorObject || {};
    throw new autobahn.Error(errorUri, message, errorObject);
};

exports.CONNECTION_CLOSED_SUCCESSFUL = undefined;
