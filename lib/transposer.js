'use strict';

var regExCache = {
    array: new RegExp(/(.*?)\[(.*?)\]/), //looks for [<contents>],
    cond: new RegExp(/([^<>=]+)([<>=])([^<>=]+)/), //looks for a>b , a<b, a=b pattern
    math: new RegExp(/([^\+-]+)([\+-])([^\+-]+)/), //looks for a+b, a-b
    exp: new RegExp(/(.*?)\((.*?)\)/) //look for (<contents>)
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


function conditional(lhs, op, rhs) {
    var lhs = processVal(lhs),
        rhs = processVal(rhs);
    return function doCheck(entry) {
        var lvalue = (lhs.isProp) ? entry[lhs.val] : lhs.val,
            rvalue = (rhs.isProp) ? entry[rhs.val] : rhs.val;

        if (typeof(lvalue) === 'object' || typeof(rvalue) === 'object') {
            return false;
        }

        switch (op) {
            case '>':
                return lvalue > rvalue;

            case '>=':
                return lvalue >= rvalue;

            case '<':
                return lvalue < rvalue;

            case '<=':
                return lvalue <= rvalue;

            case '=':
                return lvalue == rvalue; // jshint ignore:line

            default:
                return false;
        }
    };
}

function math(lhs, op, rhs) {
    lhs = processVal(lhs);
    rhs = processVal(rhs);

    return function doMath(entry) {
        var lvalue = (lhs.isProp) ? entry[lhs.val] : lhs.val,
            rvalue = (rhs.isProp) ? entry[rhs.val] : rhs.val;

        if (typeof lvalue === 'object' || typeof rvalue === 'object') {
            return NaN;
        }
        switch (op) {
            case '+':
                return lvalue + rvalue;

            case '-':
                return lvalue - rvalue;

            case '*':
                return lvalue * rvalue;

            case '/':
                return lvalue / rvalue;

            default:
                return NaN;
        }
    }
}

function processVal(val) {
    var isProp = (val.indexOf && val.indexOf('@') !== -1);

    if (isProp) {
        val = val.replace('@.', '');
    } else {
        try {
            val = val.replace(/'/g, '');
        } catch (e) {}
    }
    return {
        isProp: isProp,
        val: val
    };
}

function handleArr(args, doSpread) {
    var exp, tmp,
        loc = args.locator,
        processors = args.processors,
        idx = args.idx;

    exp = regExCache.array.exec(loc.replace(/\s/g, ''));
    if(!exp) {
        throw new Error('Invalid Jsonpath');
    }

    if(doSpread) {
        processors.push(spread(findKey(exp[1])));
    } else {
        processors.push(mapAndFilter(prop(exp[1])));
    }

    if(loc.indexOf('@') !== -1) {
        tmp = regExCache.exp.exec(exp[2]);
        if (!tmp) {
            throw new Error('Invalid JSONPath');
        }
        handleArrArg(tmp[2].replace(/\s/g, ''), processors);

    } else {
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
    }
}

function handleArrArg (loc, processors) {
    var tmp, exp;
    exp = regExCache.cond.exec(loc);
    if (exp) {
        processors.push(spread(filter(conditional(exp[1], exp[2], exp[3]))));
    } else {
        exp = regExCache.math.exec(loc);
        if (exp) {
            processors.push(mapAndFilter(genProp(math(exp[1], exp[2], exp[3]))));
        } else {
            processors.push(spread(filter(prop(loc.replace('@.', '')))));
        }
    }
}

function process(pattern) {

    var locators = pattern.replace('$.', '').split('.'),
        processors = [],
        idx = 0, loc, idx1, idx2, tmp;

    while (idx < locators.length) {

        loc = locators[idx];
        idx1 = loc.indexOf('[');
        idx2 = loc.indexOf(']');


        if (loc === '*') {
            // .* operator
            processors.push(spread(keys()));
        } else if(loc.length === 0) {
            // .. operator
            tmp = locators[++idx];
            idx1 = tmp.indexOf('[');
            idx2 = tmp.indexOf(']');
            if(idx1 !== -1) {
                if (idx2 === -1) {
                    tmp = stitchLocator(locators, idx);
                    idx = tmp.idx;
                    loc = tmp.loc;
                }
                handleArr({locator: tmp.loc || tmp, processors: processors, idx: idx}, true);
            } else {
                processors.push(spread(findKey(tmp)));
            }
        }
        else if (idx1 !== -1) {
            if (idx2 === -1) {
                tmp = stitchLocator(locators, idx);
                idx = tmp.idx;
                loc = tmp.loc;
            }
            handleArr({locator: loc, idx: idx, processors: processors});
        } else {
            processors.push(mapAndFilter(prop(loc)));
        }
        idx++;
    }
    return processors;
}

function stitchLocator (locators, currIdx) {
    var tmp = locators[currIdx],
        idx = currIdx+1;
    while (idx < locators.length && locators[idx].indexOf(']') === -1) {
        tmp += '.' + locators[idx];
        idx++;
    }
    tmp += '.' + locators[idx];
    idx++;
    if(idx > locators.length) {
        throw new Error('Invalid JsonPath');
    }
    return {
        loc: tmp,
        idx: idx
    };
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
