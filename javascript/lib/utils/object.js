const has = Object.prototype.hasOwnProperty;

const forEachOnObject = (object, handler) => {
    if(!isObject(object)) {
        throw new TypeError('Not a plain object!');
    }
    for(const property in object) {
        if(has.call(object, property)) {
            handler.call(null, property, object[property]);
        }
    }
};

const isObject = (object) => {
    return typeof object == 'object' && object !== null;
};

const mergeObjects = (objectFrom, objectTo) => {
    if(!isObject(objectFrom) || !isObject(objectTo)) { throw new TypeError('Both parameters should be a plain object.'); }

    var merged = copyObject(objectTo);

    forEachOnObject(objectFrom, (property, value) => {
        if(isObject(value)) {
            if( isObject(objectTo[property])) {
                merged[property] = mergeObjects(objectFrom[property], objectTo[property]);
            } else {
                merged[property] = copyObject(value);
            }
        } else {
            merged[property] = objectFrom[property];
        }
    });
    return merged;

};

const copyObject = (obj) => {
    if(!isObject(obj)) { throw new TypeError('The parameter should be a plain object.') }

    var copied = {};
    forEachOnObject(obj, (property, value) => { copied[property] = value; });
    return copied;
};

const isArray = (array) => {
    return isObject(array) && array instanceof Array;
};

module.exports = {forEachOnObject, isObject, has, isArray, mergeObjects};