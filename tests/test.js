'use strict';
var fastpath = require('../index'),
    jsonPath = require ('JSONPath'),
    test = require('tape');

test('fastpath', function (t) {

    t.test('should be able to parse simple object refs', function (t) {
        var obj = {
                'a': {
                    'b': {
                        'c' : 'Found'
                    }
                }
            },
            pattern = '$.a.b.c',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.a.*',
            tr = fastpath(pattern);

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.*.blue',
            tr = fastpath(pattern);

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.*.blue.*',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[*]',
            tr = fastpath(pattern);


        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[1,2]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[1]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[*].foo[*]',
            tr = fastpath(pattern);

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h.length',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[(@.length-2)]',
            tr = fastpath(pattern);

        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(@.foo)]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(@.foo>12)]',
            tr = fastpath(pattern);

        t.deepEqual(tr.evaluate(obj),  jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(12 > @.foo)]',
            tr = fastpath(pattern);

        t.deepEqual(tr.evaluate(obj),  jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(12.2 > @.foo)]',
            tr = fastpath(pattern);

        t.deepEqual(tr.evaluate(obj),  jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(\'lala\' = @.foo)]',
            tr = fastpath(pattern);

        //JSON PATH RETURNS WRONG VALUE ? maybe?

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
            pattern = '$.b.h[?(\'12\' > @.foo)]',
            tr = fastpath(pattern);

        //JSON PATH RETURNS WRONG VALUE ? maybe?
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
            pattern = '$.b.h[:2]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[-2:]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[1:5:2]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b..h',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$..h',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$..h[1]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$..h[1,2]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$..h[*]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$..h[?(@.foo)]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$..h[?(@.foo>12)]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$..h[(@.length-2)]',
            tr = fastpath(pattern);

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
            pattern = '$..h.length',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(12 > @.foo)]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(12 >= @.foo)]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
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
            pattern = '$.b.h[?(12 <= @.foo)]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
        t.end();
    });

    //from root patterns.
    t.test('array at root', function(t) {
        var obj = [
                {   'b': 'la',
                    'c': [
                        {id: 'a1', val: 1, oldVal: 5},
                        {id: 'a2', val: 2, oldVal: 1},
                        {id: 'a3', val: 3, oldVal: 3}
                    ]
                },
                false,
                1,
                2
            ],
            pattern = '$[0].c[*].val',
            tr;
        try{
            tr = fastpath(pattern);
        } catch(e) {
            console.info(e.stack);
        }
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
        t.end();
    });

    t.test('array at root with conditional', function(t) {
        var obj = [
                {id: 'a1', val: 1, oldVal: 5},
                {id: 'a2', val: 2, oldVal: 1},
                {id: 'a3', val: 3, oldVal: 3}
            ],
            pattern = '$[?(@.val <= @.oldVal)]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
        t.end();
    });

    //error cases

    t.test('should test error with invalid pattern', function(t) {
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
            pattern = '$.b.h[?(12 > @.foo]',
            tr;
        try {
            tr = fastpath(pattern);
        } catch(e) {
            t.deepEqual(e.message, 'Invalid JSONPath');
        }
        t.end();
    });

    t.test('should test error with invalid pattern', function(t) {
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
            pattern = '$.b.h[?(12 > @.foo)',
            tr;
        try {
            tr = fastpath(pattern);
        } catch(e) {
            t.deepEqual(e.message, 'Invalid JSONPath');
        }
        t.end();
    });

    t.test('should test [1, 2] key values but in an obj', function(t) {
        var obj = {
                'b': {
                    1: 'la',
                    2: 'boo',
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
            pattern = '$.b[1,2]',
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), jsonPath.eval(obj, pattern));
        t.end();
    });

    t.test('should test named patterns', function(t) {
        var obj = {
                'b': {
                    1: 'la',
                    2: 'boo',
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
            pattern = {
                foos : '$.b.h[*].foo',
                strrings: '$.b[1,2]'
            },
            tr = fastpath(pattern);
        t.deepEqual(tr.evaluate(obj), { foos: [ [ 1, 2, 3 ], [ 4, 5, 6 ], 12, 13.5, 11.8 ], strrings: [ 'la', 'boo' ] });
        t.end();
    });


});

