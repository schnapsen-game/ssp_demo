'use strict';
const must = require('must');
const {spy} = require('sinon');

const {createApi, testScenario} = require('./wamp-api-testftamework')

const {ProtocolError} = require('./api-error');
var defaultConnection = { realm: 'ssp-game', url: 'ws://localhost:8080/ws', maxRetries: 0, autoReconnect: false};

describe('Test the api.js WAMP server related functions', () => {

    describe('Connection to the WAMP router', () => {
        it('should connect to the WAMP router, calling the onconnect successfully.', (done) => {
            var isConnected = spy();
            var api = createApi(null, defaultConnection);
            testScenario([api], done, () => {
                return Promise.resolve(isConnected());
            }, () => {
                must(isConnected.calledOnce).to.be.true();
            });
        }, {autoRegisterAll: false, autoSubscribeAll: false});
    });

    describe('Register - Call', () => {

        it('should register a function to the WAMP dealer', (done) => {
            var isRegistered = spy();
            var api = createApi(null, defaultConnection);
            testScenario([api], done, () => {
                api.add.callee('test', () => {});
                return api.register['test']().then( () => {isRegistered()} );
            }, () => {
                must(isRegistered.calledOnce).to.be.true();
            }, {autoRegisterAll: false, autoSubscribeAll: false});
        });

        it('should call a registered function, give a string param, returns string', (done) => {
            var isCalled = spy();
            var input = 'test string';
            var expected = 'test';

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (str) => {
                isCalled(str);
                return str.slice(0, 4);
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(input);
            }, (error, result)=> {
                must(result).to.be.a.string();
                must(result).to.be(expected);
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be(input);

            });
        });

        it('should call a registered function, numeric, multiple input, returns numeric result', (done) => {
            var isCalled = spy();
            var inputA = 4.3;
            var inputB = 5.9;
            var expected = 10.2;

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (p1, p2) => {
                isCalled(p1, p2);
                return p1 + p2;
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(inputA, inputB)
            }, (error, result)=> {
                must(result).to.be.a.number();
                must(result).to.be(expected);
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be(inputA);
                must(isCalled.getCall(0).args[1]).to.be(inputB);
            });
        });

        it('should call a registered function, inputs are objects and number, returns object result', (done) => {
            var isCalled = spy();
            var inputA = {a: 4.1};
            var inputB = 5.9;
            var expected = {a: 4.1, b: 5.9};

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1, arg2) => {
                isCalled(arg1, arg2);
                return {a: arg1.a, b: arg2};
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(inputA, inputB);
            }, (error, result)=> {
                must(result).to.be.an.object();
                must(result).to.be.eql(expected);
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.eql(inputA);
            });

        });

        it('should call a registered function, with multiple array input, returns array result', (done) => {
            var isCalled = spy();
            var inputA = [4.1, 5.1];
            var inputB = [5.9, 9.1];
            var expected = [4.1, 5.1, 5.9, 9.1];

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1, arg2) => {
                isCalled(arg1, arg2);
                return arg1.concat(arg2);
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=> {
                return api.call.testCall(inputA, inputB)
            }, (error, result)=> {
                must(result).to.be.an.array();
                must(result).to.be.eql(expected);
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.eql(inputA);
                must(isCalled.getCall(0).args[1]).to.be.eql(inputB);
            });
        });

        it('should call a registered function, returns array with a single result', (done) => {
            var isCalled = spy();
            var inputA = 'I\'m a lonely string';
            var expected = ['I\'m a lonely string'];

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1) => {
                isCalled(arg1);
                return [arg1];
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(inputA);
            }, (error, result)=> {
                must(result).to.be.an.array();
                must(result).to.be.eql(expected);
                must(result).length(1);
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.eql(inputA);
            });
        });

        it('should register more than one functions with register all, and make a successful call on them.', (done) => {
            var isCalled1 = spy();
            var isCalled2 = spy();
            var isRegisteredAll = spy();
            var input = 'test';
            var expected1 = 'test1';
            var expected2 = 'test2';

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall1', (arg) => {
                isCalled1();
                return `${arg}1`;
            });
            api.add.callee('testCall2', (arg) => {
                isCalled2();
                return `${arg}2`;
            });
            api.add.caller('testCall1');
            api.add.caller('testCall2');

            testScenario([api], done, ()=>{
                return api.registerAll()
                    .then(() => {
                        isRegisteredAll();
                    })
                    .then(() => {
                        return Promise.all([api.call.testCall1(input), api.call.testCall2(input)]);
                    })
            }, (error, [result1, result2])=> {
                must(isRegisteredAll.calledOnce).to.be(true);
                must(isCalled1.calledOnce).to.be(true);
                must(isCalled2.calledOnce).to.be(true);
                must(result1).to.be(expected1);
                must(result2).to.be(expected2);
            }, {autoRegisterAll: false, autoSubscribeAll: false});
        });

        it('throws a predefined protocol error from a registered function, captured in a caller callback.', (done) => {
            var isCalled = spy();
            var input = 6;
            var inputErrorCode = 'test.error';
            var inputErrorText = 'This is a test error with details';
            var expectedErrorCode = 'test.error';
            var expectedErrorText = 'This is a test error with details';
            var expectedDetails = {arguments: input};

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg) => {
                isCalled();
                throw new ProtocolError(inputErrorCode, inputErrorText, {arguments: 6});
                return arg;
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(input);
            }, (error, result)=> {
                must(error).to.be.a(ProtocolError);
                must(error.code).to.be(expectedErrorCode);
                must(error.message).to.be(expectedErrorText);
                must(error.details).to.be.an.object();
                must(error.details).to.be.eql(expectedDetails)
                must(isCalled.calledOnce).to.be(true);
            }, {
                catchErrorAfterClosed: true,
                autoSubscribeAll: false
            });
        });

        it('throws a generic JS error from an RPC registered function, captured as an Internal Server Error in a caller callback.', (done) => {
            var isCalled = spy();
            var input = 4.1;
            var inputErrorMessage = 'test error message';
            var expectedErrorCode = 'error.internal_server_error';
            var expectedErrorText = 'Internal Server Error.';

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg) => {
                isCalled();
                throw new Error(inputErrorMessage);
                return arg;
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(input);
            }, (error, result)=> {
                must(error).to.be.a(ProtocolError);
                must(error.code).to.be(expectedErrorCode);
                must(error.message).to.be(expectedErrorText);
                must(error.details).to.be.an.object();
                must(isCalled.calledOnce).to.be(true);
            }, {
                catchErrorAfterClosed: true
            });
        });

        it('throws a runtime JS error from the registered function, captured as an Internal Server error at callers side.', (done) => {
            var isCalled = spy();
            var args = 4.1;
            var expectedErrorCode = 'error.internal_server_error';
            var expectedErrorText = 'Internal Server Error.';
            var testFunction = (args) => {
                isCalled();
                variable = 'value'; // it will cause a ReferenceError in runtime
                return args;
            };

            var api = createApi(null, defaultConnection);
                api.add.callee('testCall', testFunction);
                api.add.caller('testCall');

            testScenario([api], done, ()=> {
                return api.call.testCall(args);
            }, (error, result)=> {
                must(error).to.be.a(ProtocolError);
                must(error.code).to.be(expectedErrorCode);
                must(error.message).to.be(expectedErrorText);
                must(error.details).to.be.an.object();
                must(isCalled.calledOnce).to.be(true);
            }, {
                catchErrorAfterClosed: true,
                autoSubscribeAll: false,
            });
        });

        it('should fail by a library error, when invalid uri is used', (done) => {
            var isRegistered = spy();
            var expectedErrorText = 'Topic URI doesn\'t meet requirements!';

            var api = createApi(null, defaultConnection);
            api.add.callee('.testCall', () => {}); // invalid uri, should not start with a '.'

            testScenario([api], done, ()=>{
                return api.register['.testCall']()
                    .then( () => { isRegistered() } )
                    .then( () => { return api.call.testCall(a, b) })
            }, (error, result)=> {
                must(error).to.be.a(ProtocolError);
                must(error.message).to.be(expectedErrorText);
                must(error.details).to.be.an.object();
                must(isRegistered.called).to.be(false);
            }, {
                catchErrorAfterClosed: true,
                autoRegisterAll: false,
                autoSubscribeAll: false,
            });
        });

        it('should fail, by a message broker error, when non registered function is called', (done) => {
            var isCalled = spy();
            var expectedErrorText = 'no callee registered for procedure';
            var expectedErrorCode = 'wamp.error.no_such_procedure';

            var api = createApi(null, defaultConnection);
            api.add.caller('testCall', isCalled);

            testScenario([api], done, ()=>{
                return api.call.testCall()
                    .then( () => { isCalled() } );
            }, (error, result)=> {
                must(error).to.be.a(ProtocolError);
                must(error.message).startWith(expectedErrorText);
                must(error.code).to.be(expectedErrorCode);
                must(error.details).to.be.an.object();
                must(isCalled.called).to.be(false);
            }, {
                catchErrorAfterClosed: true,
                autoRegisterAll: false,
                autoSubscribeAll: false,
            });
        });

        it('should call an RPC, input undefined --> null, result undefined --> null', (done) => {
            var isCalled = spy();

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1, arg2) => {
                isCalled(arg1, arg2);
                return undefined;
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(undefined, undefined);
            }, (error, result)=> {
                must(result).to.be.null();
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.null();
                must(isCalled.getCall(0).args[1]).to.be.null();
            }, {
            });
        });

        it('should call an RPC, input null --> null, result null --> null', (done) => {
            var isCalled = spy();

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1, arg2) => {
                isCalled(arg1, arg2);
                return undefined;
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall(null, null);
            }, (error, result)=> {
                must(result).to.be.null();
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.null();
                must(isCalled.getCall(0).args[1]).to.be.null();
            }, {
            });
        });

        it('should call an RPC, input missing --> undefined, result missing --> null', (done) => {
            var isCalled = spy();

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1, arg2) => {
                isCalled(arg1, arg2);
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall();
            }, (error, result)=> {
                must(result).to.be.null();
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.undefined();
                must(isCalled.getCall(0).args[1]).to.be.undefined();
            });
        });

        it('should call an RPC, input empty object, result, empty object', (done) => {
            var isCalled = spy();

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1) => {
                isCalled(arg1);
                return {};
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall({});
            }, (error, result)=> {
                must(result).to.be.an.object();
                must(result).to.be.eql({});
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.an.object();
                must(isCalled.getCall(0).args[0]).to.be.eql({});
            });
        });

        it('should call an RPC, input empty array, result empty array', (done) => {
            var isCalled = spy();

            var api = createApi(null, defaultConnection);
            api.add.callee('testCall', (arg1) => {
                isCalled(arg1);
                return [];
            });
            api.add.caller('testCall');

            testScenario([api], done, ()=>{
                return api.call.testCall([]);
            }, (error, result)=> {
                must(result).to.be.an.array();
                must(result).to.be.eql([]);
                must(isCalled.calledOnce).to.be(true);
                must(isCalled.getCall(0).args[0]).to.be.an.array();
                must(isCalled.getCall(0).args[0]).to.be.eql([]);

            });
        });
    });

    describe('Publish - Subscribe', () => {
        it('should subscribe to a channel', (done) => {
            var isSubscribed = spy();

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', () => {});

            testScenario([api], done, () => {
                return api.subscribe.test().then( (uri) => { isSubscribed(); return uri });
            }, (error, result) => {
                must(result).to.be('test');
                must(isSubscribed.calledOnce).to.be.true();
            }, { autoSubscribeAll: false, autoRegisterAll: false } );

        });

        it('should publish a scalar to a channel', (done) => {
            var isPublished = spy();
            var onEvent = spy();
            var expectedNumber = 6;

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => { onEvent(data); });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(expectedNumber)
                    .then( (uri) => {
                        isPublished();
                        return uri;
                    });
            }, (error, result) => {
                must(isPublished.calledOnce).to.be.true();
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.calledWithExactly(expectedNumber)).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.a.number();
                must(onEvent.getCall(0).args[0]).to.be(expectedNumber);
            });
        });

        it('should publish an array to a channel', (done) => {
            var onEvent = spy();
            var expectedArray = [1, 2, 3];

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => { onEvent(data); });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(expectedArray);
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.calledWithExactly(expectedArray)).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.an.object();
                must(onEvent.getCall(0).args[0]).to.be.eql(expectedArray);

            });
        });

        it('should publish an object to a channel', (done) => {
            var onEvent = spy();
            var expectedObject = {a: 1, b: 2, c: 3};

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => { onEvent(data); });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(expectedObject)
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.calledWithExactly(expectedObject)).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.an.object();
                must(onEvent.getCall(0).args[0]).to.be.eql(expectedObject);
            });

        });

        it('should publish an array with a single result', (done) => {
            var onEvent = spy();
            var expected = ['this is a string'];

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => { onEvent(data); });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(expected);
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.calledWithExactly(expected)).to.be.true();
            });
        });

        it('should subscribe more than one channel with subscribeAll', (done) => {
            var isSubscribed = spy();
            var isPublished1 = spy();
            var isPublished2 = spy();
            var onEvent1 = spy();
            var onEvent2 = spy();

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test1', (data) => { onEvent1(data); });
            api.add.subscriber('test2', (data) => { onEvent2(data); });
            api.add.publisher('test1');
            api.add.publisher('test2');

            testScenario([api], done, () => {
                return api.subscribeAll()
                    .then( () => { isSubscribed(); return api.publish.test1(); } )
                    .then( (uri) => { isPublished1(); return api.publish.test2(); } )
                    .then( (uri) => { isPublished2(); })
            }, (error, result) => {
                must(isPublished1.calledOnce).to.be.true();
                must(isPublished2.calledOnce).to.be.true();
                must(isSubscribed.calledOnce).to.be.true();
                must(onEvent1.calledOnce).to.be.true();
                must(onEvent2.calledOnce).to.be.true();
            }, { autoRegisterAll: false, autoSubscribeAll: false });
        });

        it('fails the subscription because of library error, invalid uri.', (done) => {
            var isSubscribed = spy();
            var onEvent = spy();

            var api = createApi(null, defaultConnection);
            api.add.subscriber('.test', (data) => { onEvent(data); }); //invalid uri, should not start with '.'

            testScenario([api], done, () => {
                return api.subscribe['.test']()
                    .then( (uri) => {
                        isSubscribed();
                    })
            }, (error, result) => {
                must(error).be.a(ProtocolError);
                must(error.message).be.a.string();
                must(error.message).startWith('Topic URI doesn\'t meet requirements');
                must(onEvent.called).to.be.false();
                must(isSubscribed.called).to.be.false();

            }, { catchErrorAfterClosed: true, autoRegisterAll: false, autoSubscribeAll: false });
        });

        it('fails the publishing, because of library error, invalid uri.', (done) => {
            var isPublished = spy();

            var api = createApi(null, defaultConnection);
            api.add.publisher('.test');

            testScenario([api], done, () => {
                return api.publish['.test']()
                    .then( (uri) => {
                        isPublished();
                    })
            }, (error, result) => {
                must(error).be.a(ProtocolError);
                must(error.message).be.a.string();
                must(error.message).startWith('Topic URI doesn\'t meet requirements');
                must(isPublished.called).to.be.false();
            }, { catchErrorAfterClosed: true });

        });

        it('fails the subscription, because of a message broker error'); //TODO: authentication error can be causes this, still not implemented
        it('fails the publishing, because of a message broker error'); //TODO: authentication error can be causes this, still not implemented

        it('should publish an empty array', (done) => {
            var onEvent = spy();
            var input = [];
            var expected = [];

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => { onEvent(data); });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(input);
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.calledWithExactly(expected)).to.be.true();
            });
        });

        it('should publish an empty object', (done) => {
            var onEvent = spy();
            var input = {};
            var expected = {};

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => { onEvent(data); });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(input);
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.eql(expected);
            });
        });

        it('should publish an undefined value, subscription got undefined', (done) => {
            var onEvent = spy();
            var input = undefined;

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => {
                onEvent(data);
            });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(input);
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.undefined();
            });
        });

        it('should publish a null value, subscription got null', (done) => {
            var onEvent = spy();
            var input = null;

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => {
                onEvent(data);
            });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(input);
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.null();
            });
        });

        it('should not publish any value, got undefined', (done) => {
            var onEvent = spy();

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => {
                onEvent(data);
            });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test();
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.undefined();
            });
        });

        it('should publish multiple values as an argument, got it as an array.', (done) => {
            var onEvent = spy();
            var input1 = 1;
            var input2 = 'str';
            var input3 = [1, 2, 3];
            var input4 = {a: 1, b: 2};
            var expected = [1, 'str', [1, 2, 3], {a: 1, b: 2}];

            var api = createApi(null, defaultConnection);
            api.add.subscriber('test', (data) => {
                onEvent(data);
            });
            api.add.publisher('test');

            testScenario([api], done, () => {
                return api.publish.test(input1, input2, input3, input4);
            }, (error, result) => {
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be.eql(expected);
            });
        });
    });

    describe('Error cases.', () => {
        it('should sent back an api added error in an RPC callback', (done) => {
            var onCalled = spy();
            var expectedErrorCode = 'custom';
            var expectedErrorMessage = 'this is a predefined test error message';
            var expectedErrorDetails = {detail: 'custom details'};

            var api = createApi(null, defaultConnection);
            api.add.error(expectedErrorCode, expectedErrorMessage);
            api.add.callee('test', () => {
                onCalled();
                throw api.error[expectedErrorCode](expectedErrorDetails);
                return 'normal result';
            });
            api.add.caller('test');
            testScenario([api], done, () => {
                return api.call.test();
            }, (error, result) => {
                must(error).be.a(ProtocolError);
                must(error.message).be(expectedErrorMessage);
                must(error.code).be(expectedErrorCode);
                must(error.details).be.an.object();
                must(error.details).be.eql(expectedErrorDetails);
            }, { catchErrorAfterClosed: true });
        });
    });

    describe('Multiple services and prefixes.', () => {

        it('should execute an RPC call with a prefix', (done) => {
            var inputA = 3;
            var inputB = 4;
            var expected = 7;

            var service1 = createApi('service1', defaultConnection);
            service1.add.callee('add', (a, b) => a + b);
            service1.add.caller('add');

            testScenario([service1], done, ()=>{
                return service1.call.add(inputA, inputB);
            }, (error, result)=>{
                must(result).be(expected);
            });
        });

        it('should execute two RPC calls, with different prefixes using the same connection and the same uri postfix.', (done) => {
            var isCalled1 = spy();
            var isCalled2 = spy();
            var inputA = 4;
            var inputB = 3;
            var expected1 = 7;
            var expected2 = 1;

            var service1 = createApi('service1', defaultConnection);
            service1.add.callee('test', (a, b) => { isCalled1(); return a + b } );
            service1.add.caller('test');

            var service2 = createApi('service2', null, service1);
            service2.add.callee('test', (a, b) => { isCalled2(); return a - b } );
            service2.add.caller('test');

            testScenario([service1], done, () => {
                service2.connect();
                return service2.registerAll().then(() => {
                    var p1 = service1.call.test(inputA, inputB);
                    var p2 = service2.call.test(inputA, inputB);
                    return Promise.all([p1, p2]);
                });
            }, (error, [result1, result2])=>{
                must(result1).to.be(expected1);
                must(result2).to.be(expected2);
                must(isCalled1.calledOnce).to.be.true();
                must(isCalled2.calledOnce).to.be.true();
            });
        });

        it('should execute 2 RPC calls, using different prefixes, same ur postfix and different connections.', (done) => {
            var isCalled1 = spy();
            var isCalled2 = spy();
            var inputA = 4;
            var inputB = 3;
            var expected1 = 7;
            var expected2 = 1;

            var service1 = createApi('service1', defaultConnection);
            service1.add.callee('test', (a, b) => { isCalled1(); return a + b});
            service1.add.caller('test');

            var service2 = createApi('service2', defaultConnection);
            service2.add.callee('test', (a, b) => { isCalled2(); return a - b} );
            service2.add.caller('test');

            testScenario([service1, service2], done, () => {
                var p1 = service1.call.test(inputA, inputB);
                var p2 = service2.call.test(inputA, inputB);
                return Promise.all([p1, p2]);
            }, (error, [result1, result2])=>{
                must(result1).to.be(expected1);
                must(result2).to.be(expected2);
                must(isCalled1.calledOnce).to.be.true();
                must(isCalled2.calledOnce).to.be.true();
            });
        });

        it('should execute an RPC call, the callee and caller has the same uri, but running on different connection', (done) => {
            var inputA = 4;
            var inputB = 3;
            var expected = 7;

            var service1 = createApi('service', defaultConnection);
            service1.add.callee('test', (a, b) => { return a + b});

            var service2 = createApi('service', defaultConnection);
            service2.add.caller('test');

            testScenario([service1, service2], done, () => {
                return service2.call.test(inputA, inputB);
            }, (error, result)=>{
                must(result).to.be(expected);
            });
        });

        it('should execute a PUBSUB, using a service prefix.', (done) => {
            var input = 4;
            var expected = 4;
            var onEvent = spy();

            var service = createApi('service', defaultConnection);
            service.add.subscriber('test', (arg) => { onEvent(arg) });
            service.add.publisher('test');

            testScenario([service], done, () => {
                return service.publish.test(input);
            }, (error, result)=>{
                must(onEvent.calledOnce).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be(expected);
            });
        });

        it('should execute 2 PUBUSB, using different prefixes, but same connection.', (done) => {
            var input = 4;
            var expected = 4;
            var onEvent1 = spy();
            var onEvent2 = spy();

            var service1 = createApi('service1', defaultConnection);
            service1.add.subscriber('test', (arg) => { onEvent1(arg) });
            service1.add.publisher('test');

            var service2 = createApi('service2', null, service1);
            service2.add.subscriber('test', (arg) => { onEvent2(arg) });
            service2.add.publisher('test');

            testScenario([service1], done, () => {
                service2.connect();
                return service2.subscribeAll().then( () => {
                    var p1 = service1.publish.test(input);
                    var p2 = service2.publish.test(input);
                    return Promise.all([p1, p2]);
                } ) ;
            }, (error, [result1, result2])=>{
                must(onEvent1.calledOnce).to.be.true();
                must(onEvent2.calledOnce).to.be.true();
                must(onEvent1.getCall(0).args[0]).to.be(expected);
                must(onEvent2.getCall(0).args[0]).to.be(expected);
            });
        });

        it('should publish an event to multiple subscriptions, on different connections', (done) => {
            var input = 4;
            var expected = 4;
            var onEvent1 = spy();
            var onEvent2 = spy();

            var service1 = createApi('service', defaultConnection);
            service1.add.subscriber('test', (arg) => { onEvent1(arg) });

            var service2 = createApi('service', defaultConnection);
            service2.add.subscriber('test', (arg) => { onEvent2(arg) });

            var service3 = createApi('service', defaultConnection);
            service3.add.publisher('test');

            testScenario([service1, service2, service3], done, () => {
                return service3.publish.test(input);
            }, (error, result)=>{
                must(onEvent1.calledOnce).to.be.true();
                must(onEvent2.calledOnce).to.be.true();
                must(onEvent1.getCall(0).args[0]).to.be(expected);
                must(onEvent2.getCall(0).args[0]).to.be(expected);
            });
        });

        it('should receive an event from different connection\'s publishes.', (done) => {
            var input1 = 4;
            var expected1 = 4;
            var input2 = 5;
            var expected2 = 5;
            var onEvent = spy();

            var service1 = createApi('service', defaultConnection);
            service1.add.subscriber('test', (arg) => { onEvent(arg) });

            var service2 = createApi('service', defaultConnection);
            service2.add.publisher('test');

            var service3 = createApi('service', defaultConnection);
            service3.add.publisher('test');

            testScenario([service1, service2, service3], done, () => {
                return service2.publish.test(input1).then(() => {
                    return service3.publish.test(input2);
                });
            }, (error, result)=>{
                must(onEvent.calledTwice).to.be.true();
                must(onEvent.getCall(0).args[0]).to.be(expected1);
                must(onEvent.getCall(1).args[0]).to.be(expected2);
            });
        });
    });
});
