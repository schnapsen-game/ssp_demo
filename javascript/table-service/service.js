'use strict';
var service = require('./table-service.js');
var serviceHandler = require('../lib/service-handler')(service.shutdownHandler);

service.main();
