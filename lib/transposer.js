function prop(name) {
    return function (obj) {
        return obj[name];
    };
}

function genProp(fn) {
    return function (obj) {
        return obj[fn(obj)];
    }
}

function pick(idxArr) {
    var idxObj = {};
    idxArr.forEach(function(entry) {
        idxObj[entry] = true;
    });
    return function (entry, idx) {
        return (idxObj[idx+''] !== void 0) ? true: false;
    }
}

function mapAndFilter(fn) {
    return function (arr) {
        var res = [];
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
    return function (arr) {
        var res = [];
        arr.forEach(function(entry) {
            res = res.concat(fn(entry));
        });
        return res;
    }
}

function filter(fn) {
    return function (arr) {
        return arr.filter(fn);
    };
}

function keys() {
    return function (obj) {
        var res = [];
        Object.keys(obj).map(function(key) {
            res.push(obj[key]);
        });
        return res;
    }
}

function conditional(prop, op, value) {
    return function (entry) {
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
    return function (entry) {
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

function process(pattern) {
    var locators = pattern.replace('$.', '').split('.'),
        processors = [];

    locators.forEach(function(loc) {
        var idx1 = loc.indexOf('['),
            idx2 = loc.indexOf(')]'),
            exp, tmp;
        if (loc === '*') {
           processors.push(spread(keys()));
        }
        else if (idx1 !== -1) {
            if (loc.indexOf('@') !== -1) {
                processors.push(mapAndFilter(prop(loc.substring(0, idx1))));
            } else {
                exp = regExCache.array.exec(loc);
                if (exp.length > 1) {
                    processors.push(mapAndFilter(prop(exp[1])));
                    processors.push((exp[2] === '*') ? spread(keys()) : spread(filter(pick(exp[2].split(',')))));
                } else {
                    return void 0;
                }
            }
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
    });
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
        eval: function (obj) {
            return processors.reduce(function(prev, current) {
                return current(prev);
            }, [obj]);
        }
    };
};

var regExCache = {
    array: new RegExp(/(.*?)\[(.*?)\]/), //looks for [<contents>],
    cond: new RegExp(/([^<>=]+)([<>=])([^<>=]+)/), //looks for a>b , a<b, a=b pattern
    math: new RegExp(/([^\+-]+)([\+-])([^\+-]+)/) //looks for a+b, a-b
};