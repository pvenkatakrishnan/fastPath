'use strict';

var regExCache = {
    array: new RegExp(/(.*?)\[(.*?)\]/), //looks for [<contents>],
    cond: new RegExp(/([^<>=]+)([<>=])([^<>=]+)/), //looks for a>b , a<b, a=b pattern
    math: new RegExp(/([^\+-]+)([\+-])([^\+-]+)/) //looks for a+b, a-b
};

function prop(name) {
    return function getProp(obj) {
        return obj[name];
    };
}

function genProp(fn) {
    return function doGenProp(obj) {
        return obj[fn(obj)];
    };
}

function pick(arr) {
    var obj, i, len;

    if (!arr.length) {
        return function () {
            return false;
        };
    }

    for(obj = {}, i = 0, len = arr.length; i < len; i++) {
        obj[arr[i]] = true;
    }

    return function doPick(entry, idx) {
        return idx in obj;
    };
}

function filter(fn) {
    return function doFilter(arr) {
        var result, i, len, current;

        result = [];
        if (!arr.length) {
            return result;
        }

        for (i = 0, len = arr.length; i < len; i++) {
            current = arr[i];
            if (fn(current, i, arr)) {
                result[result.length] = current;
            }
        }

        return result;
    };
}

function pickRange(start, end, step) {
    var fn;

    if (step) {
        fn = filter(function (entry, idx) {
            return ((idx === start || ((idx - start) % step) === 0) && idx < end);
        });
    }

    return function doPickRange(arr) {
        return (fn && fn(arr)) || (end !== undefined ? arr.slice(start, end): arr.slice(start));
    };
}

function mapAndFilter(fn) {
    return function doMapFilter(arr) {
        var result, i, len, current;

        result = [];

        if (!arr.length) {
            return result;
        }

        for (i = 0, len = arr.length; i < len; i++) {
            current = fn(arr[i]);
            if (current !== undefined) {
                result[result.length] = current;
            }
        }

        return result;
    };
}

function spread(fn) {
    return function doSpread(arr) {
        var result, i, len, current;

        result = [];

        for (i = 0, len = arr.length; i < len; i++) {
            current = fn(arr[i]);
            if (current) {
                result = result.concat(current);
            }
        }

        return result;
    };
}

function keys() {
    return function getValues(obj) {
        var result, keys, i, len;

        result = [];

        if (typeof obj !== 'object') {
            return result;
        }

        keys = Object.keys(obj);
        for (i = 0, len = keys.length; i < len; i++) {
            result[i] = obj[keys[i]];
        }

        return result;
    };
}

function findKey(name) {
    return function find(obj) {
        var result, keys, i, len, prop, value;

        result = [];
        keys = Object.keys(obj);

        for (i = 0, len = keys.length; i < len; i++) {
            prop = keys[i];
            value = obj[prop];

            if (name === prop || name === '*') {
                result[result.length] = value;
            }

            if (typeof value === 'object') {
                result = result.concat(find(value));
            }
        }

        return result;
    };
}

function conditional(prop, op, value) {
    var val = (value.indexOf('\'') !== -1) ? value.replace(/'/g, '') : parseFloat(value);

    return function doCheck(obj) {
        var current;

        current = obj[prop];

        if (typeof current === 'object') {
            return false;
        }

        switch (op) {
            case '>':
                return current > val;

            case '>=':
                return current >= val;

            case '<':
                return current < val;

            case '<=':
                return current <= val;

            case '=':
                return current == val;

            default:
                return false;
        }

    };
}

function processVal(prop, op, value) {
    var val = parseFloat(value);

    return function doProcess(entry) {
        var current;

        current = entry[prop];

        if (typeof current === 'object') {
            return NaN;
        }

        switch (op) {
            case '+':
                return current + val;

            case '-':
                return current - val;

            case '*':
                return current * val;

            case '/':
                return current / val;

            default:
                return NaN;
        }
    }
}

function handleArr(args, doSpread) {
    var exp, tmp,
        loc = args.locator,
        processors = args.processors,
        idx = args.idx;

    if (loc.indexOf('@') !== -1) {
        if(doSpread) {
            processors.push(spread(findKey(loc.substring(0, idx))));
        } else {
            processors.push(mapAndFilter(prop(loc.substring(0, idx))));
        }
    } else {
        exp = regExCache.array.exec(loc);
        if (exp) {
            if(doSpread) {
                processors.push(spread(findKey(exp[1])));
            } else {
                processors.push(mapAndFilter(prop(exp[1])));
            }
            if(exp[2] === '*') {
                //[*]
                processors.push(spread(keys()));
            } else if((idx = exp[2].indexOf(':') )!== -1) {
                tmp = exp[2].split(':');
                if(tmp.length < 3) {
                    //n: or :n pattern
                    processors.push(spread((idx === 0) ? pickRange(0, parseInt(tmp[1])): pickRange(parseInt(tmp[0]))));
                } else {
                    //start:end:step
                    processors.push(spread(pickRange(parseInt(tmp[0]), parseInt(tmp[1]), parseInt(tmp[2]))));
                }
            } else {
                //[n], [1,2,...,n]
                processors.push(spread(filter(pick(exp[2].split(',')))));
            }

        } else {
            return void 0;
        }
    }
}

function handleArrArg (loc, processors, idx) {
    var tmp, exp;
    tmp = loc.substring(0, idx);
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
}

function process(pattern) {

    var locators = pattern.replace('$.', '').split('.'),
        processors = [],
        idx = 0, loc, idx1, idx2, tmp;

    while (idx < locators.length) {
        loc = locators[idx];
        idx++;
        idx1 = loc.indexOf('[');
        idx2 = loc.indexOf(')]', idx1);

        if (loc === '*') {
            // .* operator
            processors.push(spread(keys()));
        } else if(loc.length === 0) {
            // .. operator
            tmp = locators[idx];
            idx1 = tmp.indexOf('[');
            if(idx1 !== -1) {
                handleArr({locator: tmp, processors: processors, idx: idx1}, true);
            } else {
                processors.push(spread(findKey(tmp)));
            }
            idx++;
        }
        else if (idx1 !== -1) {
            handleArr({locator:loc, processors: processors, idx: idx1});
        } else if (idx2 !== -1) {
            handleArrArg(loc, processors, idx2);
        } else {
            processors.push(mapAndFilter(prop(loc)));
        }
    }
    return processors;
}

module.exports = function (pattern) {
    var processors = process(pattern);
    return {
        pattern: pattern,
        evaluate: function evaluate(obj) {
            try {
                return processors.reduce(function(prev, current) {
                    return current(prev);
                }, [obj]);
            }
            catch(e) {
                return void 0;
            }
        }
    };
};