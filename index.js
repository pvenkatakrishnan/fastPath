'use strict';

var Transposer = require('./lib/transposer');


exports.create = function create(pattern) {
    return new Transposer(pattern);
};
