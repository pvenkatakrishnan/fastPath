var regExCache = {
    array: /(.*?)\[(.*?)\]/, //looks for [<contents>],
    cond: /([^<>=]+)([<>=][=]*)([^<>=]+)/, //looks for a>b , a<b, a=b, a>=b, a<=b patterns
    math: /([^\+-]+)([\+-])([^\+-]+)/, //looks for a+b, a-b
    exp: /(.*?)\((.*?)\)/ //look for (<contents>)
};

let prop = (name => (obj => obj[name]));
let genProp = (fn => (obj => obj[fn(obj)]));

function pick(arr) {

    if (!arr.length) {
        return (() => false);
    }
    let obj = {};
    arr.forEach(entry => obj[entry] = true);
    return ((entry, idx) => idx in obj) ;
}

function filter(fn) {
    return function doFilter(arr) {
        let result = [];
        if(typeof arr !== 'object' || arr === null) {
            return result;
        }

        let current;
        Object.keys(arr).forEach(i => (current = fn(arr[i], i)) ? result[result.length] = arr[i] : undefined);
        return result;
    };
}

function pickRange(start, end, step) {
    var fn;

    if (step) {
        fn = filter((entry, idx) => ((idx === start || ((idx - start) % step) === 0) && idx < end));
    }
    return (arr => (fn && fn(arr)) || (end !== undefined ? arr.slice(start, end): arr.slice(start)));
}

function mapAndFilter(fn) {
    return function doMapFilter(arr) {
        let result = [];
        if (typeof arr !== 'object' || arr === null) {
            return result;
        }

        let current;
        Object.keys(arr).forEach(i => ((current = fn(arr[i], i))!== undefined) ? (result[result.length] = current) : undefined);
        return result;
    };
}

function spread(fn) {
    return function doSpread(arr) {
        let result = [];
        let current;
        arr.forEach(entry => result = (current = fn(entry)) ? result.concat(current): result);
        return result;
    };
}

function keys() {
    return function getValues(obj) {
        let result = [];

        if (typeof obj !== 'object' || obj === null) {
            return result;
        }

        let keys = Object.keys(obj);
        keys.forEach((item, i) => result[i] = obj[keys[i]]);
        return result;
    };
}

function findKey(name) {
    return function find(obj) {
        let result = [];

        if (typeof obj !== 'object' || obj === null) {
            return result;
        }

        Object.keys(obj).forEach(function(key) {
            let value = obj[key];
            if (name === key || name === '*') {
                result[result.length] = value;
            }

            if (typeof value === 'object') {
                result = result.concat(find(value));
            }
        });
        return result;
    };
}

function processVal(val) {
    let isProp = (val.indexOf && val.indexOf('@') !== -1);

    if (isProp) {
        val = val.replace('@.', '');
    } else {
        try {
            val = val.replace(/'/g, '');
        } catch (e) {}
    }
    return {
        isProp,
        val
    };
}

function conditional(lhs, op, rhs) {
    lhs = processVal(lhs);
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
    };
}


function handleArrArg (loc, processors) {
    let exp = regExCache.cond.exec(loc);
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

function handleArr({locator, processors, idx}, doSpread) {

    let exp = regExCache.array.exec(locator.replace(/\s/g, ''));
    if(!exp) {
        throw new Error('Invalid JSONPath');
    }

    if(doSpread) {
        processors.push(spread(findKey(exp[1])));
    } else {
        //could be a pattern like $[<content>]
        if (exp[1] !== '$') {
            processors.push(mapAndFilter(prop(exp[1])));
        }
    }

    let tmp;
    if(locator.indexOf('@') !== -1) {
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

function stitchLocator (locators, currIdx) {
    let loc = locators[currIdx];
    let idx = currIdx + 1;

    do {
        loc += '.' + locators[idx];
    } while (locators[idx++].indexOf(']') === -1 && idx < locators.length);

    return {
        loc,
        idx
    };
}

function process(pattern) {

    var locators = pattern.replace('$.', '').split('.'),
        processors = [],
        idx = 0, loc, idx1, idx2, tmp;

    while (idx < locators.length) {

        loc = locators[idx];
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
                handleArr({locator: tmp.loc || tmp, processors, idx}, true);
            } else {
                processors.push(spread(findKey(tmp)));
            }
        }
        else if (loc.indexOf('[') !== -1) {
            if (loc.indexOf(']') === -1) {
                //has  [<pattern>]
                tmp = stitchLocator(locators, idx);
                idx = tmp.idx;
                loc = tmp.loc;
            }
            handleArr({locator: loc, idx, processors});
        } else {
            //simple .prop ref
            processors.push(mapAndFilter(prop(loc)));
        }
        idx++;
    }
    return processors;
}

export default function fastpath(pattern) {
    
    return {
        pattern,
        evaluate: (obj => process(pattern).reduce((prev, current) => current(prev), [obj]))
    };
};
