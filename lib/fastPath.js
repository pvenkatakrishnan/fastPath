'use strict';

var regExCache = {
    array: /(.*?)\[(.*?)\]/, //looks for [<contents>],
    cond: /([^<>=]+)([<>=][=]*)([^<>=]+)/, //looks for a>b , a<b, a=b, a>=b, a<=b patterns
    math: /([^\+-]+)([\+-])([^\+-]+)/, //looks for a+b, a-b
    exp: /(.*?)\((.*?)\)/ //look for (<contents>)
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
    var obj = {};

    if (!arr.length) {
        return function() {
            return false;
        };
    }

    arr.forEach(function(current) {
        obj[current] = true;
    });

    return function doPick(entry, idx) {
        return obj.hasOwnProperty(idx);
    };
}

function filter(fn) {
    return function doFilter(arr) {
        var result = [];

        if (typeof arr !== 'object' || arr === null) {
            return result;
        }

        Object.keys(arr).forEach(function(current) {
            if (fn(arr[current], current)) {
                result.push(arr[current]);
            }
        });

        return result;
    };
}

function pickRange(start, end, step) {
    var fn;

    if (step) {
        fn = filter(function(entry, idx) {
            return ((idx === start || ((idx - start) % step) === 0) && idx < end);
        });
    }

    return function doPickRange(arr) {
        return (fn && fn(arr)) || arr.slice(start, end);
    };
}

function mapAndFilter(fn) {
    return function doMapFilter(arr) {
        var result = [],
            current;

        if (typeof arr !== 'object' || arr === null) {
            return result;
        }

        Object.keys(arr).forEach(function(i) {
            if ((current = fn(arr[i], i)) !== undefined) {
                result.push(current);
            }
        });

        return result;
    };
}

function spread(fn) {
    return function doSpread(arr) {
        return arr.reduce(function(result, current) {
            return result.concat(fn(current) || []);
        }, []);
    };
}

function keys() {
    return function getValues(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return [];
        }

        return Object.keys(obj).map(function(current) {
            return obj[current];
        });
    };
}

function findKey(name) {
    return function find(obj) {
        var result = [],
            prop, value;

        for (prop in obj) {

            if (obj.hasOwnProperty(prop)) {
                value = obj[prop];

                if (name === prop || name === '*') {
                    result[result.length] = value;
                }

                if (typeof value === 'object' && value !== null) {
                    result = result.concat(find(value));
                }
            }
        }

        return result;
    };
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

function conditional(lhs, op, rhs) {
    lhs = processVal(lhs);
    rhs = processVal(rhs);
    return function doCheck(entry) {
        var lvalue = (lhs.isProp) ? entry[lhs.val] : lhs.val,
            rvalue = (rhs.isProp) ? entry[rhs.val] : rhs.val;

        if (typeof lvalue === 'object' || typeof rvalue === 'object') {
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
    };
}


function handleArrArg(loc, processors) {
    var exp;
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

function handleArr(args, doSpread) {
    var exp, tmp,
        loc = args.locator,
        processors = args.processors,
        idx = args.idx;

    exp = regExCache.array.exec(loc.replace(/\s/g, ''));
    if (!exp) {
        throw new Error('Invalid JSONPath');
    }

    if (doSpread) {
        processors.push(spread(findKey(exp[1])));
    } else {
        //could be a pattern like $[<content>]
        if (exp[1] !== '$') {
            processors.push(mapAndFilter(prop(exp[1])));
        }
    }

    if (loc.indexOf('@') !== -1) {
        tmp = regExCache.exp.exec(exp[2]);
        if (!tmp) {
            throw new Error('Invalid JSONPath');
        }
        handleArrArg(tmp[2].replace(/\s/g, ''), processors);

    } else {
        if (exp[2] === '*') {
            //[*]
            processors.push(spread(keys()));
        } else if ((idx = exp[2].indexOf(':')) !== -1) {
            tmp = exp[2].split(':');
            if (tmp.length < 3) {
                //n: or :n pattern
                processors.push(spread((idx === 0) ? pickRange(0, parseInt(tmp[1], 10)) :
                            pickRange(parseInt(tmp[0], 10))));
            } else {
                //start:end:step
                processors.push(spread(pickRange(parseInt(tmp[0], 10), parseInt(tmp[1], 10),
                            parseInt(tmp[2], 10))));
            }
        } else {
            //[n], [1,2,...,n]
            processors.push(spread(filter(pick(exp[2].split(',')))));
        }
    }
}

function stitchLocator(locators, currIdx) {
    var tmp = locators[currIdx],
        idx = currIdx + 1;

    do {
        tmp += '.' + locators[idx];
    } while (locators[idx++].indexOf(']') === -1 && idx < locators.length);

    return {
        loc: tmp,
        idx: idx
    };
}

function process(pattern) {

    var locators = pattern.replace('$.', '').split('.'),
        processors = [],
        idx = 0,
        loc,
        idx1,
        idx2,
        tmp;

    while (idx < locators.length) {

        loc = locators[idx];

        if (loc === '*') {
            // .* operator
            processors.push(spread(keys()));
        } else if (loc.length === 0) {
            // .. operator
            tmp = locators[++idx];
            idx1 = tmp.indexOf('[');
            idx2 = tmp.indexOf(']');
            if (idx1 !== -1) {
                if (idx2 === -1) {
                    tmp = stitchLocator(locators, idx);
                    idx = tmp.idx;
                    loc = tmp.loc;
                }
                handleArr({
                    locator: tmp.loc || tmp,
                    processors: processors,
                    idx: idx
                }, true);
            } else {
                processors.push(spread(findKey(tmp)));
            }
        } else if (loc.indexOf('[') !== -1) {
            if (loc.indexOf(']') === -1) {
                //has  [<pattern>]
                tmp = stitchLocator(locators, idx);
                idx = tmp.idx;
                loc = tmp.loc;
            }
            handleArr({
                locator: loc,
                idx: idx,
                processors: processors
            });
        } else {
            //simple .prop ref
            processors.push(mapAndFilter(prop(loc)));
        }
        idx++;
    }
    return processors;
}

module.exports = function(pattern) {

    var processors = process(pattern);
    return {
        pattern: pattern,
        evaluate: function evaluate(obj) {
            return processors.reduce(function(prev, current) {
                return current(prev);
            }, [obj]);
        }
    };
};
