'use strict';
function processEntry(obj, pattern) {
    var locator = pattern.replace('$.', '').split('.'),
        result = obj,
        idx = 0,
        key,
        isArray,
        parts,
        cParts,
        temp;

    while (idx < locator.length) {
        key = locator[idx];

        isArray = Array.isArray(result);
        if (key === '*') {
            result = (isArray) ? procArrResults(result, evalStar) : evalStar(result);
        } else if(key[0] === '.') {
            //TODO need the '..' operator
            // ..foo finds everything in the tree that is 'foo'

        } else if(key.indexOf('[') !== -1) {
            parts = regExCache.array.exec(key);
            //TODO: this part is brittle!!!!! revisit (referencing indices directly)
            if (parts === null) {
                result = processConditionals(key, locator[++idx], result);
            }
            else if (parts[2] === '*') {
                result = (isArray) ? procArrResults(result, evalArray, parts[1]): result[parts[1]];
            }
            else {
                temp = result[parts[1]];
                cParts = parts[2].split(',');

                result = (cParts.length > 1) ?
                    ((isArray) ? procArrResults(temp, evalArrMultiIdx, cParts): evalArrMultiIdx(temp, cParts)):
                    ((isArray) ? procArrResults(temp, evalArrSingleIdx, cParts[0]): evalArrSingleIdx(temp, cParts[0]));
            }
        } else {
            //check just in case result is an array and we are trying to get val of result.length
            result = (isArray && !result[key]) ? procArrResults(result, evalObject, [key]) : result[key];
        }
        if (result === void 0) {
            break;
        }
        idx++;
    }

    //make all results as an array
    if(result !== void 0 && !Array.isArray(result)) {
        result = [result];
    }
    return result;
}

function processConditionals(key, nextKey, obj) {
    var parts = key.split('['),
    expTemp1 =  nextKey.replace(')]', ''),
    temp =  obj[parts[0]],
    isArray = Array.isArray(obj),
    expTemp2,
    result;

    if (key.indexOf('?') !== -1) {
        expTemp2 = regExCache.cond.exec(expTemp1) || [expTemp1];
        //its a conditional filter
        result = (isArray) ?
            procArrResults(temp, evalArrCond, [temp, genConditionFnc(expTemp2)]) : evalArrCond(temp, genConditionFnc(expTemp2));
    } else {
        expTemp2 = doMath(temp, regExCache.math.exec(expTemp1));
        result = (isArray) ? procArrResults(temp, evalArray, expTemp2): temp[expTemp2];
    }
    return result;
}

function procArrResults(array, fn, argsArr) {
    var result = [];
    array.forEach(function(entry) {
        var a = (argsArr) ?  [entry].concat(argsArr): [entry],
            val = fn ? fn.apply(null, a) : array[entry] ;
        if (val !== void 0) {
            if(collapseTree[fn.name]) {
                result = result.concat(val);
            } else {
                result.push(val);
            }
        }
    });
    return result;
}

function parseVal(type, val) {
    var result;

    try {
        switch (type) {
            case 'number':
                if(val.indexOf('.') !== -1) {
                    return parseFloat(val);
                } else {
                    return parseInt(val);
                }
                break;

            case 'boolean':
                return JSON.parse(val);
                break;

            case 'string':
            default:
                return val;
                break;

        }
    } catch(e) {
        return val;
    }
}

function genConditionFnc(arr) {
    var lhs,
        rhs,
        op;
    if (arr.length > 1) {
        op = arr[2];

        return function(elem) {
            lhs = elem[arr[1]];
            if (typeof lhs === 'object') return void 0;

            rhs = parseVal(typeof lhs, arr[3]);
            if((op === '>' && lhs > rhs)
                || (op === '<' && lhs < rhs)
                || (op === '=' && lhs === rhs)) {
                return elem;
            }
        }
    } else {
        lhs = arr[0];
        return function(elem) {
            return elem[lhs];
        }
    }
}

function doMath(obj, arr)  {
    var lhs = obj[arr[1]],
        op = arr[2],
        rhs = parseVal(typeof lhs, arr[3]);

    switch (op) {
        case '+': return(lhs + rhs); break;
        case '-': return (lhs - rhs); break;
        default: return void 0; break;
    }
}

//evaluate a .* operator
function evalStar(obj) {
    var result = [];
    if(Array.isArray(obj) || typeof obj !== 'object') {
        return void 0;
    }
    Object.keys(obj).forEach(function(key) {
        result.push(obj[key]);
    });
    return result;
}

//evaluate .. operator
function evalDotOp(obj) {
    //TODO
    //rules to operate on .. operator
}

//evaluate [*] operator
function evalArray(obj, prop) {
    return evalObject(obj, prop);
}

//evaluate [idx] operator
function evalArrSingleIdx(obj,idx) {
    return obj[idx];
}

//evaluate [idx1, idx2] operator
function evalArrMultiIdx(obj, idxArr) {
    return idxArr.map(function(entry) {
        return obj[entry];
    });
}

//array with condition
function evalArrCond(obj, fn) {
    var result = [];
    obj.forEach(function(entry) {
        var map = fn(entry);
        if (map) result.push(map);
    });
    return result;
}

//evaluate .prop operator
function evalObject(obj, prop) {
    return obj[prop];
}

var collapseTree = {
    evalStar: true,
    evalArray: true,
    evalObj: false
};

var regExCache = {
    array: new RegExp(/(.*?)\[(.*?)\]/), //looks for [<contents>]
    cond: new RegExp(/([^<>=]+)([<>=])([^<>=]+)/), //looks for a>b , a<b, a=b pattern
    math: new RegExp(/([^\+-]+)([\+-])([^\+-]+)/) //looks for a+b, a-b
};

module.exports = processEntry;