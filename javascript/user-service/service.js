'use strict';

var service = require('./user-service');
var serviceHandler = require('../lib/service-handler')(service.shutdownHandler);
service.main();