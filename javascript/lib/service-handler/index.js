'use strict';

var shutdownHandler = undefined;

module.exports = function (givenShutdonwHandler) {
    shutdownHandler = givenShutdonwHandler;
};

process.on('SIGTERM', function () {
    console.log('INFO: SIGTERM received, closing the connection...');
    shutdownHandler();
});

process.on('SIGINT', function (reason) {
    console.log('INFO: SIGINT received, closing the connection...');
    shutdownHandler(reason);
});
