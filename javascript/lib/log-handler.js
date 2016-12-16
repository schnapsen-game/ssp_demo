// { emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }
'use strict';

var winston = require('winston');
var slice = Array.prototype.slice;

exports.getLogger = function () {
    var logger = new winston.Logger({
        transports: [
            new (winston.transports.Console)()
        ]
    });
    logger.setLevels(winston.config.syslog.levels);
    logger.level = process.env.NODE_LOG_LEVEL || 'info';

    var logFunction = function (level, args) {
        logger.log.apply(logger, [level].concat(slice.call(args, 0)));
    };

    console.log('LOGLEVEL: %s', logger.level);

    return {
        emerg: function (message) { logFunction('emerg', arguments); },
        alert: function (message) { logFunction('alert', arguments); },
        crit: function (message) { logFunction('crit', arguments); },
        error: function (message) { logFunction('error', arguments); },
        warning: function (message) { logFunction('warning', arguments); },
        notice: function (message) { logFunction('notice', arguments); },
        info: function (message) { logFunction('info', arguments); },
        debug: function (message) { logFunction('debug', arguments); }
    }
};

exports.getDebugger = function (namespace) {
    var debug = require('debug')(namespace);

    console.log('DEBUGGER NAMESPACE: %s', namespace);
    return function (message) {
        debug.apply(null, slice.call(arguments));
    }
}
