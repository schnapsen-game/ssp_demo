'use strict';

var shutdownHandler = undefined;

module.exports = function (givenShutdownHandler) {
    shutdownHandler = givenShutdownHandler;
};

process.on('SIGTERM', function (reason) {
    console.log('INFO: SIGTERM received, closing the connection...');
    shutdownHandler(reason);
});

process.on('SIGINT', function (reason) {
    console.log('INFO: SIGINT received, closing the connection...');
    shutdownHandler(reason);
});
