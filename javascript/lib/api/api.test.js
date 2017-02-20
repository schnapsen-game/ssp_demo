const must = require('must');

const apiHandler = require('./api');
const {ApiError} = require('./api-error');
const spy = require('sinon');

describe('api.js', () => {
    var api;
    beforeEach( () => {
        delete(api);
        api = apiHandler.getApi({realm: 'ssp-game', url: 'ws://localhost:8080/ws'});
    });

    describe('.add', () => {
        describe('.publisher', () => {
            it('should add a publisher function', () => {
                api.add.publisher('api.publisher1');
                must(api.publish['api.publisher1']).be.a.function();
            });
            it('should throw an APiError, if the publisher function already exists', () => {
                api.add.publisher('api.publisher1');
                var f = api.add.publisher.bind(null, 'api.publisher1');
                must(f).throw(ApiError);
            });
            it('should fail when referring an undefined publisher', () => {
                must(api.publish['api.notDefined']).to.be.undefined();
            });
        });

        describe('.subscriber', () => {
            it('should add a subscriber function', () => {
                api.add.subscriber('api.subscriber1', (param) => `param: ${param}` );
                must(api.subscribe['api.subscriber1']).be.a.function();
            });
            it('should throw an ApiError, if the subscriber function already exists', () => {
                api.add.subscriber('api.subscriber1');
                var f = api.add.subscriber.bind(null, 'api.subscriber1');
                must(f).throw(ApiError);
            });
            it('should fail when referring an undefined subscriber', () => {
                must(api.subscribe['api.notDefined']).to.be.undefined();
            });
        });

        describe('.caller', () => {
            it('should add a caller function', () => {
                api.add.caller('api.caller1');
                must(api.call['api.caller1']).be.a.function();
            });
            it('should throw an ApiError, if the caller function already exists', () => {
                api.add.caller('api.caller1');
                var f = api.add.caller.bind(null, 'api.caller1');
                must(f).throw(ApiError);
            });
            it('should fail when referring an undefined caller', () => {
                must(api.call['api.notDefined']).to.be.undefined();
            });
        });

        describe('.callee', () => {
            it('should add a register function', () => {
                api.add.callee('api.register1', (param) => `param: ${param}` );
                must(api.register['api.register1']).be.a.function();
            });
            it('should throw an ApiError, if the register function already exists', () => {
                api.add.callee('api.register1');
                var f = api.add.callee.bind(null, 'api.register1');
                must(f).throw(ApiError);
            });
            it('should fail when referring an undefined register', () => {
                must(api.register['api.notDefined']).to.be.undefined();
            });
        });

        describe('.error', () => {
            it('should add an error function', () => {
                api.add.error('api.error1', (param) => `param: ${param}` );
                must(api.error['api.error1']).be.a.function();
            });
            it('should throw an ApiError, if the error function already exists', () => {
                api.add.error('api.error1');
                var f = api.add.error.bind(null, 'api.error1');
                must(f).throw(ApiError);
            });
            it('should fail when referring an undefined error function', () => {
                must(api.error['api.notDefined']).to.be.a.undefined();
            });
        });


    });



});
