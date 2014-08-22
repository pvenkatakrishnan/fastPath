'use strict';
var transposer = require('../lib/transposer'),
    jsonPath = require ('JSONPath'),
    test = require('tape');

test('transposer', function (t) {

    t.test('should be able to parse simple object refs', function (t) {
        var obj = {
                'a': {
                    'b': {
                        'c' : 'Found'
                    }
                }
            },
            tr = transposer('$.a.b.c');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.a.b.c'));
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
            },
            tr = transposer('$.a.*');

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.a.*'));
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
            },
            tr = transposer('$.*.blue');

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.*.blue'));
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
            },
            tr = transposer('$.*.blue.*');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.*.blue.*'));
        t.end();
    });


    t.test('should test for simple array - with idx *', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {1: 2},
                        [3,4,5],
                        'blue',
                        true
                    ]
                }
            },
            tr = transposer('$.b.h[*]');


        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[*]'));
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
            },
            tr = transposer('$.b.h[1,2]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[1,2]'));
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
            },
            tr = transposer('$.b.h[1]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[1]'));
        t.end();
    });

    t.test('should test for simple array - with multi idx', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: {color: 'blue'}},
                        true
                    ]
                }
            },
            tr = transposer('$.b.h[*].foo[*]');

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[*].foo[*]'));
        t.end();
    });

    t.test('should test referencing the length of array', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        'blue',
                        true
                    ]
                }
            },
            tr = transposer('$.b.h.length');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h.length'));
        t.end();
    });

    t.test('should test referencing a specific item in the array using length and @', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        'blue',
                        true
                    ]
                }
            },
            tr = transposer('$.b.h[(@.length-2)]');

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[(@.length-2)]'));
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
            },
            tr = transposer('$.b.h[?(@.foo)]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[?(@.foo)]'));
        t.end();
    });

    t.test('should test conditionals using ? for filter with @ first', function(t) {
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
            },
            tr = transposer('$.b.h[?(@.foo>12)]');

        t.deepEqual(tr.evaluate(obj),  jsonPath.eval(obj, '$.b.h[?(@.foo>12)]'));
        t.end();
    });

    t.test('should test conditionals using ? for filter with @ after', function(t) {
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
            },
            tr = transposer('$.b.h[?(12 > @.foo)]');

        t.deepEqual(tr.evaluate(obj),  jsonPath.eval(obj, '$.b.h[?(12 > @.foo)]'));
        t.end();
    });

    t.test('should test conditionals using ? for filter with floats', function(t) {
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
            },
            tr = transposer('$.b.h[?(12.2 > @.foo)]');

        t.deepEqual(tr.evaluate(obj),  jsonPath.eval(obj, '$.b.h[?(12.2 > @.foo)]'));
        t.end();
    });
    t.test('should test conditionals using ? for filter with strings', function(t) {
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
                        [3,4,5],
                        {foo: 'lala', name: 'd'}
                    ]
                }
            },
            tr = transposer('$.b.h[?(\'lala\' = @.foo)]');

        //PLEASE SEE!! JSON PATH RETURNS WRONG VALUE !!!!!!!

        t.deepEqual(tr.evaluate(obj),  [{foo: 'lala', name: 'd'}]);
        t.end();
    });
    t.test('should test conditionals using ? for filter with integer parsed from strings', function(t) {
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
                        [3,4,5],
                        {foo: 'lala', name: 'd'}
                    ]
                }
            },
            tr = transposer('$.b.h[?(\'12\' > @.foo)]');

        t.deepEqual(tr.evaluate(obj),  [{foo: 11.8, name: 'c'}]);
        t.end();
    });
    t.test('should test .. operator with array length', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$.b.h[:2]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[:2]'));
        t.end();
    });

    t.test('should test .. operator with array length', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$.b.h[-2:]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[-2:]'));
        t.end();
    });

    t.test('should test .. operator with array length', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$.b.h[1:5:2]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[1:5:2]'));
        t.end();
    });

    t.test('should test .. operator to look for a specific key in the object', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$.b..h');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b..h'));
        t.end();
    });

    t.test('should test .. operator to look for a specific key in root', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$..h');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$..h'));
        t.end();
    });

    t.test('should test .. operator with array single idx', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$..h[1]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$..h[1]'));
        t.end();
    });

    t.test('should test .. operator with array multi idx', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$..h[1,2]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$..h[1,2]'));
        t.end();
    });

    t.test('should test .. operator with array with *', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$..h[*]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$..h[*]'));
        t.end();
    });

    t.test('should test .. operator with array with &', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$..h[?(@.foo)]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$..h[?(@.foo)]'));
        t.end();
    });

    t.test('should test .. operator with array with conditionals', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$..h[?(@.foo>12)]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$..h[?(@.foo > 12)]'));
        t.end();
    });

    t.test('should test .. operator with array with array length operations', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5],
                        {h: [1,2,3,4,5]}
                    ]
                }
            },
            tr = transposer('$..h[(@.length-2)]');

        //PLEASE SEE: JSON Path crashes!!!!!!!!!!!
        t.deepEqual(tr.evaluate(obj), [ [ 3, 4, 5 ], 4 ]);
        t.end();
    });

    t.test('should test .. operator with array length', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12.9, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$..h.length');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$..h.length'));
        t.end();
    });


    t.test('should test .. operator with array with conditionals', function(t) {
        var obj = {
                'b': {
                    'h': [
                        {foo: [1,2,3]},
                        {foo: [4,5,6]},
                        {foo: 12, name: 'a'},
                        {foo: 13.5, name: { 'h': 45}},
                        {foo: 11.8, name: 'c'},
                        true,
                        123,
                        [3,4,5]
                    ]
                }
            },
            tr = transposer('$.b.h[?(12 > @.foo)]');
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, '$.b.h[?(12 > @.foo)]'));
        t.end();
    });

});

