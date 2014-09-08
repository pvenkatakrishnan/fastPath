'use strict';

var fastpath =  require('./lib/fastPath');

module.exports = function(pattern) {
    var res = {};

    if (typeof pattern === 'string') {
        //simple string patterns
        return fastpath(pattern);
    } else {
        //named patterns
        var keys = Object.keys(pattern);
        keys.forEach(function(key) {
            res[key] = fastpath(pattern[key]);
        });

        return {
            evaluate: function(obj) {
                keys.forEach(function(key) {
                    res[key] = res[key].evaluate(obj);
                });
                return res;
            }
        };
    }
};