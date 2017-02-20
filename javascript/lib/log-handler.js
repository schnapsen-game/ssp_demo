'use strict';
/**
 * Common library provides a logger and debugger setup for all the modules.
 */

var slice = Array.prototype.slice;

exports.getLogger = function (namespace) {
    var loggerEngine = require('winston');

    var logger = new loggerEngine.Logger({
        transports: [
            new (loggerEngine.transports.Console)()
        ]
    });
    logger.setLevels(loggerEngine.config.syslog.levels);
    logger.level = process.env.NODE_LOG_LEVEL || 'info';

    var logFunction = function (level, args) {
        logger.log.apply(logger, [level].concat(`[${namespace}]`).concat(slice.call(args, 0)));
    };

    console.log('LOGLEVEL: %s', logger.level);

    return {
        emerg: function (message) { logFunction('emerg', arguments); },
        alert: function (message) { logFunction('alert', arguments); },
        crit: function (message) { logFunction('crit', arguments); },
        error: function (message) { logFunction('error', arguments); },
        warn: function (message) { logFunction('warning', arguments); },
        notice: function (message) { logFunction('notice', arguments); },
        info: function (message) { logFunction('info', arguments); },
        debug: function (message) { logFunction('debug', arguments); }
    }
};

exports.getDebugger = function (namespace) {
    var debuggerEngine = require('debug')(namespace);

    console.log('DEBUGGER NAMESPACE: %s', namespace);
    return function (message) {
        debuggerEngine.apply(null, slice.call(arguments));
    }
}
