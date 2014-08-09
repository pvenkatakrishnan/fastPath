var processor = require('./lib/transposer');
module.exports = function() {
    return {
        transpose: function transpose(data, spec) {

            var result = {};

            if(!spec) return data;

            if(!(typeof spec === 'object')) {
                throw new Error('Invalid spec');
            }

            Object.keys(spec).forEach(function(key) {
               result[key] = processor(data, spec[key]);
            });
            return result;
        },

        eval: function map(data, pattern) {
            return processor(data, pattern);
        }

    }
};

