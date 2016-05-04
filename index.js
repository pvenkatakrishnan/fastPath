import fastpath from './lib/fastPath';

export default function fastpather(pattern) {
    let input = {};
    let output = {};
    if (typeof pattern === 'string') {
        //simple string patterns
        return fastpath(pattern);
    } else {
        //named patterns
        return traverse(pattern);
    }
};

function traverse(object) {
    let keys = Object.keys(object);
    console.info('object before', object);
    keys.forEach(function(entry) {
        if (typeof object[entry] === 'object') {
            traverse(object[entry]);
        } else if(typeof object[entry] === 'string') {
            object[entry] = fastpath(object[entry]);
        }
        //we ignore all other basic types.
    });
    return {
        evaluate: function (obj) {
            let result = Object.assign({}, object);
            return evalObj(obj, result);
        }
    };
}

function evalObj(object, pattern) {
    let keys = Object.keys(pattern);

    keys.forEach(function(entry) {
        if(pattern[entry].evaluate && typeof pattern[entry].evaluate === 'function') {
            pattern[entry] = pattern[entry].evaluate(object);
        } else if(typeof pattern[entry] === 'object') {
            evalObj(object, pattern[entry]);
        }
    });
    return pattern;
}
