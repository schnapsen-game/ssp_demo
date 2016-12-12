'use strict';

// includes
var has = Object.prototype.hasOwnProperty;
var autobahn = require('autobahn');

// module variables
var connection = undefined;

console.log('TEST********');

function createPropertyChain(object, properties) {
    var newProperty;
    //console.log(object, properties);
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
exports.registerDictionary = function registerDictionary(service, dictionary) {
    forEachOnObject(dictionary, function inLoopHandler(name, handler) {
        exports.register(service, handler).then(function success() {
            console.log('INFO: service registered: ', service + '.' + name);
        }, function error(error) {
            console.log('ERROR: service could not be registered', service + '.' + name, ' because: ', error);
        });
    });
};

exports.subscribeDictionary = function subscribeDictionary(service, dictionary) {
    forEachOnObject(dictionary, function inLoopHandler(name, handler) {
        exports.subscribe(service, handler).then(function success() {
            console.log('INFO: service subscribed: ', service + '.' + name);
        }, function error(error) {
            console.log('ERROR: service could not be subscribed', service, '.', name, ' because: ', error);
        });
    });
};

exports.processApiDescription = function processApiDescription (api) {
    forEachOnObject(api, function inLoopHandler(serviceName, service) {
        exports.registerDictionary(service.uri, service.registers);
        exports.subscribeDictionary(service.uri, service.subscribers);
    });
};

// interface handlers
exports.publish = function publish(service, handler, callingArgs) {
    var args = undefined, kwargs = undefined;
    var channel = service + '.' + handler.name;
    var data = handler.apply(null, callingArgs);
    if (isObject(data) && Array.isArray(data)) {
        args = data;
    } else {
        kwargs = data;
    }
    console.log('publish invoked', channel, args, kwargs);
    return connection.session.publish(channel, args, kwargs);
};

exports.register = function register(service, handler) {
    return connection.session.register(service + '.' + handler.name, function registerHandler(args)  {
        return handler.apply(null, args);
    });
};

exports.registerService = function(name, uri) {
    connection.session.prefix(name, uri);
};

exports.subscribe = function subscribe(service, handler) {
    return connection.session.subscribe(service + '.' + handler.name, function registerHandler(args)  {
        return handler.apply(null, args);
    });
};

exports.remoteCall = function remoteCall(service, handler, callingArgs) {
    var args = undefined, kwargs = undefined;
    var channel = service + '.' + handler.name;
    var data = handler.apply(null, callingArgs);
    if (isObject(data) && Array.isArray(data)) {
        args = data;
    } else {
        kwargs = data;
    }
    return connection.session.call(channel, args, kwargs);
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

exports.CONNECTION_CLOSED_SUCCESSFUL = undefined;
