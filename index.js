'use strict';

var fastpath =  require('./lib/fastPath');

module.exports = function(pattern) {
    var input = {};
    var output = {};
    if (typeof pattern === 'string') {
        //simple string patterns
        return fastpath(pattern);
    } else {
        //named patterns
        var keys = Object.keys(pattern);
        keys.forEach(function(key) {
            input[key] = fastpath(pattern[key]);
        });

        return {
            evaluate: function(obj) {
                keys.forEach(function(key) {
                    output[key] = input[key].evaluate(obj);
                });
                return output;
            }
        };
    }
};