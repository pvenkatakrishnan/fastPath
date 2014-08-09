'use strict';
var transposer = require('../index')(),
    test = require('tape');

test('logger', function (t) {

    t.test('should be able to parse simple object refs', function (t) {
        var obj = {
            'a': {
                'b': {
                    'c' : 'Found'
                }
            }
        };
        t.deepEqual(transposer.eval(obj, '$.a.b.c'), ['Found']);
        t.end();
    });

    t.test('should test simple * operation', function(t) {
        var obj = {
            'a': {
                'b': {
                    'h':'yes'
                },
                'c': [1,2,3],
                'd': 'no'
            }
        };
        t.deepEqual(transposer.eval(obj, '$.a.*'), [{'h': 'yes'}, [1,2,3], 'no']);
        t.end();
    });

    t.test('should test * operation in a complex pattern', function(t) {
        var obj = {
            'b': {
                'h':'yes',
                'blue': true
            },
            'c': [1,2,3],
            'd': 'no',
            'e': {
                'l': 'no',
                'blue': false
            }
        };
        t.deepEqual(transposer.eval(obj, '$.*.blue'), [true, false]);
        t.end();
    });

    t.test('should test another combination pattern of * an .', function(t) {
        var obj = {
            'b': {
                'h':'yes',
                'blue': {
                    'green': {'1': '2'}
                }
            },
            'c': [1,2,3],
            'd': 'no',
            'e': {
                'l': 'no',
                'blue': [5,6,7]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.*.blue.*'), [{'1': '2'}]);
        t.end();
    });

    t.test('should test for simple array - with *', function(t) {
        var obj = {
            'b': {
                'h': [
                    {1: 2},
                    [3,4,5],
                    'blue',
                    true
                ]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.b.h[*]'), [{1: 2}, [3,4,5], 'blue', true]);
        t.end();
    });

    t.test('should test for simple array - with single idx', function(t) {
        var obj = {
            'b': {
                'h': [
                    {1: 2},
                    [3,4,5],
                    'blue',
                    true
                ]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.b.h[1]'), [3,4,5]);
        t.end();
    });

    t.test('should test for simple array - with multi idx', function(t) {
        var obj = {
            'b': {
                'h': [
                    {1: 2},
                    [3,4,5],
                    'blue',
                    true
                ]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.b.h[1,2]'), [[3,4,5],'blue']);
        t.end();
    });

    t.test('should test for simple array - with multi idx', function(t) {
        var obj = {
            'b': {
                'h': [
                    {1: 2},
                    [3,4,5],
                    'blue',
                    true
                ]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.b.h[1,2]'), [[3,4,5],'blue']);
        t.end();
    });

    t.test('should test for simple array - with multi idx', function(t) {
        var obj = {
            'b': {
                'h': [
                    {foo: [1,2,3]},
                    {foo: [4,5,6]},
                    'blue',
                    true
                ]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.b.h[*].foo[*]'), [1,2,3,4,5,6]);
        t.end();
    });

    t.test('should test referencing a specific item in array using @', function(t) {
        var obj = {
            'b': {
                'h': [
                    {foo: [1,2,3]},
                    {foo: [4,5,6]},
                    'blue',
                    true
                ]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.b.h[(@.length-2)]'), ['blue']);
        t.deepEqual(transposer.eval(obj, '$.b.h[(@.length-1)]'), [true]);
        t.deepEqual(transposer.eval(obj, '$.b.h[(@.length-3)]'), [{foo: [4,5,6]}]);
        t.deepEqual(transposer.eval(obj, '$.b.h.length'), [4]);
        t.end();
    });

    t.test('should test conditionals using ? for existence', function(t) {
        var obj = {
            'b': {
                'h': [
                    {foo: [1,2,3]},
                    {foo: [4,5,6]},
                    'blue',
                    true
                ]
            }
        };
        t.deepEqual(transposer.eval(obj, '$.b.h[?(@.foo)]'), [[1,2,3],[4,5,6]]);
        t.end();
    });

    t.test('should test conditionals using ? for comparison', function(t) {
        var obj = {
            'b': {
                'h': [
                    {foo: [1,2,3]},
                    {foo: [4,5,6]},
                    {foo: 12.9, name: 'a'},
                    {foo: 13.5, name: 'b'},
                    {foo: 11.8, name: 'c'},
                    true,
                    123,
                    [3,4,5]
                ]
            }
        };
        //it breaks if i have the comparator value is 12.5 (brittle need to fix)
        t.deepEqual(transposer.eval(obj, '$.b.h[?(@.foo>12)]'), [{foo:12.9, name: 'a'}, {foo:13.5, name: 'b'}]);
        t.end();
    });

    t.test('transpose an object into another', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: 'b'},
                        {foo: 11.8, name: 'c'},
                        {bar: 'tada'}
                    ]
                }
            },
            spec = {
                't_foo' : '$.b.h[?(@.foo>12)]',
                't_h_length': '$.b.h.length',
                't_h_lastEntry': '$.b.h[(@.length-1)]'
            };
        t.deepEqual(transposer.transpose(obj, spec), {
            't_foo': [{foo:12.9, name: 'a'}, {foo:13.5, name: 'b'}],
            't_h_length': [6],
            't_h_lastEntry': [{bar: 'tada'}]
        });
        t.end();
    });


});
