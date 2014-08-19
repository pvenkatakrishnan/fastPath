function prop(name) {
    return function getProp(obj) {
        return obj[name];
    };
}

function genProp(fn) {
    return function doGenProp(obj) {
        return obj[fn(obj)];
    }
}

function pick(idxArr) {
    var idxObj = {};
    idxArr.forEach(function(entry) {
        idxObj[entry] = true;
    });
    return function doPick(entry, idx) {
        return (idxObj[idx] !== void 0) ? true: false;
    }
}

function mapAndFilter(fn) {
    return function doMapFilter(arr) {
        var res;
        if(!arr.length) return void 0;
        res = [];
        arr.forEach(function(en) {
            var x = fn(en);
            if(x !== void 0) {
                res.push(x);
            }
        });
        return res;
    }
}

function spread(fn) {
    return function doSpread(arr) {
        var res = [];
        arr.forEach(function(entry) {
            var val;
            res = (val = fn(entry)) ? res.concat(val) :res;
        });
        return res;
    }
}

function filter(fn) {
    return function doFilter(arr) {
        if(!arr.length) return void 0;
        return arr.filter(fn);
    };
}

function keys() {
    return function getKeys(obj) {
        if (typeof obj !== 'object') return void 0;
        var res = [];
        Object.keys(obj).map(function(key) {
            res.push(obj[key]);
        });
        return res;
    }
}

function findKey(name) {

    return function find(obj) {
        var result = [];

        Object.keys(obj).forEach(function(entry) {
            if(name === entry || name === '*') {
                result.push(obj[entry]);
            }
            if (typeof obj[entry] === 'object'){
                result = result.concat(find(obj[entry]));
            }
        });
        return result;
    }
}

function conditional(prop, op, value) {
    return function doCheck(entry) {
        if(typeof entry[prop] === 'object') return false;
        var val = parseVal(typeof entry, value);
        switch (op)
        {
            case '>': return entry[prop] > val;
            break;

            case '>=': return entry[prop] >= val;
            break;

            case '<': return entry[prop] < val;
            break;

            case '<=': return entry[prop] <= val;
            break;

            case '=': return entry[prop] === val;
            break;
        }
        return false;
    }
}

function processVal(prop, op, value) {
    return function doProcess(entry) {
        var val = parseVal(typeof entry[prop], value);
        switch (op) {
            case '+': return entry[prop] + val;
                break;

            case '-': return entry[prop] - val;
                break;

            case '*': return entry[prop] * val;
                break;

            case '/': return entry[prop] / val;
                break;
        }
        return entry;
    }
}

function handleArr(loc, processors, idx, doSpread) {
    var exp;
    if (loc.indexOf('@') !== -1) {
        if(doSpread) {
            processors.push(spread(findKey(loc.substring(0, idx))));
        } else {
            processors.push(mapAndFilter(prop(loc.substring(0, idx))));
        }

    } else {
        exp = regExCache.array.exec(loc);
        //console.info(exp);
        if (exp && exp.length) {
            if(doSpread) {
                processors.push(spread(findKey(exp[1])));
            } else {
                processors.push(mapAndFilter(prop(exp[1])));
            }
            processors.push((exp[2] === '*') ? spread(keys()) : spread(filter(pick(exp[2].split(',')))));
        } else {
            return void 0;
        }
    }
}

function process(pattern) {

    var locators = pattern.replace('$.', '').split('.'),
        processors = [],
        idx = 0,
        loc,
        idx1,
        idx2,
        exp,
        tmp;

    while (idx < locators.length) {
        loc = locators[idx];
        idx++;
        idx1 = loc.indexOf('[');
        idx2 = loc.indexOf(')]');

        if (loc === '*') {
            // .* operator
           processors.push(spread(keys()));
        } else if(loc.length === 0) {
            // .. operator
            tmp = locators[idx];
            idx1 = tmp.indexOf('[');
            if(idx1 !== -1) {
                handleArr(tmp, processors, idx1, true);
            } else {
                processors.push(spread(findKey(tmp)));
            }
            idx++;
        }
        else if (idx1 !== -1) {
            handleArr(loc, processors, idx1);
        } else if (idx2 !== -1) {
            tmp = loc.substring(0, idx2);
            exp = regExCache.cond.exec(tmp);
            if (exp) {
                processors.push(spread(filter(conditional(exp[1], exp[2], exp[3]))));
            } else {
                exp = regExCache.math.exec(tmp);
                if (exp) {
                    processors.push(mapAndFilter(genProp(processVal(exp[1], exp[2], exp[3]))));
                } else {
                    processors.push(spread(filter(prop(tmp))));
                }
            }
        } else {
            processors.push(mapAndFilter(prop(loc)));
        }
    }
    return processors;
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

module.exports = function (pattern) {
    var processors = process(pattern);
    return {
        eval: function eval(obj) {
            try {
                return processors.reduce(function(prev, current) {
                    //console.info('result', prev);
                    if(prev === void 0) {
                        throw new Error('undefined');
                    }
                    return current(prev);
                }, [obj]);
            }
            catch(e) {
                return void 0;
            }
        }
    };
};

var regExCache = {
    array: new RegExp(/(.*?)\[(.*?)\]/), //looks for [<contents>],
    cond: new RegExp(/([^<>=]+)([<>=])([^<>=]+)/), //looks for a>b , a<b, a=b pattern
    math: new RegExp(/([^\+-]+)([\+-])([^\+-]+)/) //looks for a+b, a-b
};