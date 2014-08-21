'use strict';
var Transposer = require('../lib/transposer'),
    jsonPath = require ('JSONPath'),
    test = require('tape'),
    obj = require('./input.json'),
    numIterations = 10000;

test('transposer', function (t) {

    t.test('.. operator performance', function (t) {
        var pattern = '$..id';
        t.deepEqual(new Transposer(pattern).eval(obj), jsonPath.eval(obj, pattern));

        console.log('Avg time for .. op with transposer: %d nanoseconds', timeMe(transposer(pattern))/numIterations);
        console.log('Avg time for .. op with jsonpath: %d nanoseconds', timeMe(jsonpath(pattern))/numIterations);

        t.end();
    });


    t.test('wildcard operator performance', function (t) {
        var pattern = '$.*.batters.batter[*]';
        t.deepEqual(new Transposer(pattern).eval(obj), jsonPath.eval(obj, pattern));

        console.log('Avg time for * op with transposer: %d nanoseconds', timeMe(transposer(pattern))/numIterations);
        console.log('Avg time for * op with jsonpath: %d nanoseconds', timeMe(jsonpath(pattern))/numIterations);

        t.end();
    });

    t.test('conditional performance', function (t) {

        var pattern = '$.*.batters.batter[?(@.type=\'Regular\')]';
        //console.info(new Transposer(pattern).eval(obj));
        //t.deepEqual(new Transposer(pattern).eval(obj), jsonPath.eval(obj, pattern) );
        console.log('Avg time for & op with transposer: %d nanoseconds', timeMe(transposer(pattern))/numIterations);
        console.log('Avg time for & op with jsonpath: %d nanoseconds', timeMe(jsonpath(pattern))/numIterations);

        t.end();

    });

});

function transposer(pattern) {
    var tr, i, parseTime, walkTime ;
    return function() {
        for (i=0; i < numIterations; i++) {
            parseTime = timeMe(function() {
                return function() {
                    tr = new Transposer(pattern);
                }
            });
            walkTime = timeMe(function() {
                return function() {
                    tr.eval(obj);
                }
            });
            //console.log('parseTime:', parseTime, ',walkTime:', walkTime);
        }
    }
}

function jsonpath(pattern){
    var i;
    return function() {
        for(i=0; i<numIterations; i++) {
            //console.info('iteration :', i);
            jsonPath.eval(obj, pattern);
        }
    }
}

function timeMe(fn) {
    var start, diff;
    start = process.hrtime();
    fn();
    diff = process.hrtime(start);
    return (diff[0] * 1e9 + diff[1]);
}

