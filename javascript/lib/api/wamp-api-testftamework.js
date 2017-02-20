const {mergeObjects} = require('./../utils/object');
const apiHandler = require('./api');

var createApi = (uriPrefix, connectionDetails, baseApi = null) => {
    return apiHandler.getApi({connectionDetails, uriPrefix}, baseApi);
};

var testScenario = (services = [], done = null, doAfterAllConnected, doAfterAllClosed, options = {}) => {
    var _options = {
        catchErrorAfterConnected: true,
        catchErrorAfterClosed: false,
        autoRegisterAll: true,
        autoSubscribeAll: true
    };
    _options = mergeObjects(options, _options);

    var thrownError = null;
    var finalResult = null;
    var closedServices = 0;

    var closed = () => {
        closedServices++;
        if(closedServices < services.length) {
            return;
        }

        if(thrownError && !_options.catchErrorAfterClosed) {
            throw thrownError;
        }

        doAfterAllClosed(thrownError, finalResult);

        if (done) done();
    };

    var promises = [];

    services.forEach((service) => {
        let p = new Promise( (resolve, reject) => {
            service.connect( () => {
                resolve();
            }, () => {
                closed();
            }, (error, details) => {
                done('Websocket connection error.');
            });
        });
        promises.push(p);
    });

    Promise.all(promises)
        .then(() => {
            if(_options.autoRegisterAll || _options.autoSubscribeAll) {
                var promises = [];
                services.forEach((service) => {
                    if (_options.autoRegisterAll) {
                        promises.push(service.registerAll());
                    }
                    if(_options.autoSubscribeAll) {
                        promises.push(service.subscribeAll());
                    }
                });
                return Promise.all(promises);
            }
        })
        .then(() => {
            return doAfterAllConnected(); })
        .then((result) => {
            finalResult = result;
        })
        .catch((error) => {
            thrownError = error;
            if(!_options.catchErrorAfterConnected) {
                throw error;
            }
        })
        .then(() => {
            services.forEach((service) => {
                service.disconnect();
            });
        });
};

module.exports = { testScenario, createApi };