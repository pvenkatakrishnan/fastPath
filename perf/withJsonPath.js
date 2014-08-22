'use strict';
var transposer = require('../lib/transposer'),
    jsonPath = require ('JSONPath'),
    test = require('tape'),
    obj = require('./input.json'),
    numIterations = 1000;

test('transposer', function (t) {

    t.test('.. operator performance', function (t) {
        var pattern = '$..id';
        t.deepEqual(transposer(pattern).evaluate(obj), jsonPath.eval(obj, pattern));

        console.log('Avg time for .. op with transposer: %d nanoseconds', timeMe(transpose(pattern))/numIterations);
        console.log('Avg time for .. op with jsonpath: %d nanoseconds', timeMe(jsonpath(pattern))/numIterations);

        t.end();
    });


    t.test('wildcard operator performance', function (t) {
        var pattern = '$.*.batters.batter[*]';
        t.deepEqual(transposer(pattern).evaluate(obj), jsonPath.eval(obj, pattern));

        console.log('Avg time for * op with transposer: %d nanoseconds', timeMe(transpose(pattern))/numIterations);
        console.log('Avg time for * op with jsonpath: %d nanoseconds', timeMe(jsonpath(pattern))/numIterations);

        t.end();
    });

    t.test('conditional performance', function (t) {

        var pattern = '$.*.batters.batter[?(@.type=\'Regular\')]';
        //console.info(transposer(pattern).eval(obj));
        //t.deepEqual(transposer(pattern).eval(obj), jsonPath.eval(obj, pattern) );
        console.log('Avg time for & op with transposer: %d nanoseconds', timeMe(transpose(pattern))/numIterations);
        console.log('Avg time for & op with jsonpath: %d nanoseconds', timeMe(jsonpath(pattern))/numIterations);

        t.end();

    });

});

function transpose(pattern) {
    var tr, i, parseTime, walkTime ;
    return function() {
        for (i=0; i < numIterations; i++) {
            parseTime = timeMe(function() {
                return function() {
                    tr = transposer(pattern);
                }
            });
            walkTime = timeMe(function() {
                return function() {
                    tr.evaluate(obj);
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

