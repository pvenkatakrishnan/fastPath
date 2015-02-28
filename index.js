import fastpath from './lib/fastPath';

export default function fastpather(pattern) {
    let input = {};
    let output = {};
    if (typeof pattern === 'string') {
        //simple string patterns
        return fastpath(pattern);
    } else {
        //named patterns
        let keys = Object.keys(pattern);
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