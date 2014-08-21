'use strict';

var transposer = require('./lib/transposer');


exports.create = function create(pattern) {
    return transposer(pattern);
};
