/**
 * A service handler wrapper, starts the given service as a module, inject the general service handling procedures.
 */

'use strict';
var service = require('./user-service');
var serviceHandler = require('../lib/service-handler')(service.shutdownHandler);
service.main();