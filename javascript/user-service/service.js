'use strict';

var service = require('./user-service.js');
var serviceHandler = require('../lib/service-handler')(service.shutdownHandler);

service.main();

