const must = require('must');
const {spy} = require('sinon');

const {isObject, isArray, mergeObjects, forEachOnObject} = require('./object');

describe('objects.js', () => {
    describe('isObject()', () => {
        it('should be true if object given', () => {
            must(isObject({a: 5, b: 6})).be.true();
        });
        it('should be false if null given', () => {
            must(isObject(null)).be.false();
        });
        it('should be false if undefined given', () => {
            must(isObject(undefined)).be.false();
        });
        it('should be true if Array given', () => {
            must(isObject([1, 2, 3])).be.true();
        });
        it('should be true if an empty object given', () => {
            must(isObject({})).be.true();
        });
    });

    describe('isArray()', () => {
        it('should return true, if an array is given', () => {
            must(isArray([1, 2, 3])).to.be.true();
        });
        it('should return true, if an empty array is given', () => {
            must(isArray([])).to.be.true();
        });
        it('should return false, if an object given', () => {
            must(isArray({a: 1, b: 'test'})).to.be.false();
        });
        it('should return false, if an empty object is given', () => {
            must(isArray({})).to.be.false();
        });
        it('should return false, if null given', () => {
            must(isArray(null)).to.be.false();
        });
        it('should return false, if undefined given', () => {
            must(isArray(undefined)).to.be.false();
        });
        it('should return false, if a scalar given', () => {
            must(isArray('test')).to.be.false();
        })
    });

    describe('mergeObjects()', () => {
        it('should merge an object to another, overwrite the default values', () => {
            var from = {
                a: 1,
                b: 2,
                c: {
                    ca: 3.1,
                    cb: 3.2
                }
            };
            var to = {
                a: undefined,
                b: undefined,
                c: {
                    ca: undefined,
                    cb: undefined,
                }
            };
            var expected = {
                a: 1,
                b: 2,
                c: {
                    ca: 3.1,
                    cb: 3.2
                }
            };
            var result = mergeObjects(from, to);
            must(result).to.be.an.object();
            must(result).to.be.eql(expected);
            must(result).not.to.be.equal(from); //should be a new object
        });

        it('should add a property if it is not exist in the "to" object', () => {
            var from = {
                a: 1, //add a 1st level property, missing from "to".
                b: 2, //overwrite a 1st level property, exist in "to"
                c: { //overwrite a 1st level object, exist in "to"
                    ca: '3.1', //overwrite a 2nd level property, exist in "to"
                    cb: '3.2', //add a 2nd level property, missing from "to"
                    cc: { // overwrite a 2nd level object, exist in "to"
                        cca: '3.3.1', //overwrite
                        ccb: '3.3.2' //overwrite
                    },
                    cd: { // add a 2nd level object, missing from "to"
                        cda: '3.4.1' //add
                    }
                },
                d: { //add a 1st level object, missing from "to"
                    da: '4.1',  //add
                    db: '4.2'   //add
                },
            };
            var to = {
                b: true,
                c: {
                    ca: 'random string',
                    cc: {
                        cca: 'overwrite me',
                        ccb: 'over write me'
                    }
                }
            };
            var expected = {
                a: 1, //add a 1st level property, missing from "to".
                b: 2, //overwrite a 1st level property, exist in "to"
                c: { //overwrite a 1st level object, exist in "to"
                    ca: '3.1', //overwrite a 2nd level property, exist in "to"
                    cb: '3.2', //add a 2nd level property, missing from "to"
                    cc: { // overwrite a 2nd level object, exist in "to"
                        cca: '3.3.1', //overwrite
                        ccb: '3.3.2' //overwrite
                    },
                    cd: { // add a 2nd level object, missing from "to"
                        cda: '3.4.1' //add
                    }
                },
                d: { //add a 1st level object
                    da: '4.1', //add
                    db: '4.2' //add
                },
            };

            var result = mergeObjects(from, to);
            must(result).to.be.an.object();
            must(result).to.be.eql(expected);
        });
        it('should not change a property in a "to" object, if not exists in "from"', () => {
            var from = {
                b: 'changed 1',
                c: {
                    ca: 'changed 2',
                    cc: {
                        cca: 'changed 3',
                    }
                }
            };

            var to = {
                a: 1, //skip a 1st level property
                b: 2, //include a 1st level property
                c: { //include a 1st level object
                    ca: '3.1', //include a 2nd level property
                    cb: '3.2', //skip a 2nd level property
                    cc: { // include a 2nd level object
                        cca: '3.3.1',
                        ccb: '3.3.2'
                    },
                    cd: { // skip a 2nd level object
                        cda: '3.4.1'
                    }
                },
                d: { //skip a 1st level object
                    da: '4.1',
                    db: '4.2'
                }
            };

            var expected = {
                a: 1, //skip a 1st level property
                b: 'changed 1', //include a 1st level property
                c: { //include a 1st level object
                    ca: 'changed 2', //include a 2nd level property
                    cb: '3.2', //skip a 2nd level property
                    cc: { // include a 2nd level object
                        cca: 'changed 3',
                        ccb: '3.3.2'
                    },
                    cd: { // skip a 2nd level object
                        cda: '3.4.1'
                    }
                },
                d: { //skip a 1st level object
                    da: '4.1',
                    db: '4.2'
                }
            };

            var result = mergeObjects(from, to);
            must(result).to.be.an.object();
            must(result).to.be.eql(expected);
        });
        it('should change an object value property in "to", if the property exists, but not an object in "from".', () => {
            var from = {
                a: 1,
                c: {
                    ca: 'something else',
                    cc: 'this is not an object'
                },
                d: 'this is a string'
            };

            var to = {
                a: 'please change me', //change a 1st level scalar
                c: { //change a 1st level object
                    ca: '3.1', //change a 2nd level scalar
                    cc: { //overwrite a 2nd level object to a scalar
                        cca: '3.3.1',
                        ccb: '3.3.2'
                    }
                },
                d: { //overwrite a 1st level object to a scalar
                    da: '4.1',
                    db: '4.2'
                }
            };

            var expected = {
                a: 1,
                c: {
                    ca: 'something else',
                    cc: 'this is not an object'
                },
                d: 'this is a string'
            };

            var result = mergeObjects(from, to);
            must(result).to.be.an.object();
            must(result).to.be.eql(expected);

        });
        it('should change a scalar value property in "to", if the property exists, but not a scalar in "from".', () => {
            var from = {
                a: 1,
                c: {
                    ca: 'something else',
                    cc: {}
                },
                d: {
                    da: 'object element 1',
                    db: 'object element 2'
                }
            };

            var to = {
                a: 'please change me', //change a 1st level scalar
                c: {
                    ca: '3.1', //change a 2nd level scalar
                    cc: '3.2', // overwrite change a 2nd level scalar to object
                },
                d: 'another scalar' // overwrite change a 1st level scalar to object
            };

            var expected = {
                a: 1,
                c: {
                    ca: 'something else',
                    cc: {}
                },
                d: {
                    da: 'object element 1',
                    db: 'object element 2'
                }
            };

            var result = mergeObjects(from, to);
            must(result).to.be.an.object();
            must(result).to.be.eql(expected);
        });
        it('should failed gracefully, if not objects given', () => {
            var result = mergeObjects.bind(null, null, 'some string');
            must(result).throw(TypeError);
        });
    });

    describe('forEachOnObject()', () => {

        it('should iterate through an object own properties, provides to callback the key and the value', () => {
            var callback = spy();
            var testObject = {
                a: 1,
                b: 2,
                c: 3
            };
            forEachOnObject(testObject, callback);
            must(callback.callCount).to.be(3);
            must(callback.calledWithExactly('a', 1)).to.be.true();
            must(callback.calledWithExactly('b', 2)).to.be.true();
            must(callback.calledWithExactly('c', 3)).to.be.true();

        });

        it('shouldn\'t iterate on not own properties.', () => {
            var callback = spy();
            var ancestorObject = {
                c: 5,
                d: 6
            };
            var testObject = Object.create(ancestorObject);
            testObject.a = 1;
            testObject.b = 2;
            testObject.c = 3;

            forEachOnObject(testObject, callback);
            must(callback.callCount).to.be(3);
            must(callback.calledWithExactly('a', 1)).to.be.true();
            must(callback.calledWithExactly('b', 2)).to.be.true();
            must(callback.calledWithExactly('c', 3)).to.be.true();
            must(callback.neverCalledWith('c', 5)).to.be.true();
            must(callback.neverCalledWith('d', 6)).to.be.true();
        });

        it('should fail gracefully, if non object given.', () => {
            var callback = spy();
            var f = forEachOnObject.bind(null, 'not a plain object', callback);
            must(f).throw(TypeError);
            must(callback.called).to.be.false();
        });
    });

});

