/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/dataset'
], function (
    DataSet
) {
    
    var plus = '+', minus = '-';
    
    function Peak (positive, negative) {        
        this.set(positive, negative, false);        
    }; 
    
    Peak.prototype.set = function (positive, negative, force) {
        
        if(positive instanceof Peak) {
            force    = negative;
            negative = positive[minus];
            positive = positive[plus];           
        }
        
        this[plus]  = (typeof positive === 'number' && !force ? Math.max(positive, this[plus]) : positive) || 0,
        this[minus] = (typeof negative === 'number' && !force ? Math.min(negative, this[minus]) : negative) || -0;
        
        return this;
    };
    
    Peak.prototype.reset = function () {
        
        this[plus] = 0,
        this[minus] = -0;
        
        return this;
    };

	function BarGraph (fields) {
        
        fields.bufferSize = fields.bufferSize || Infinity;
        
        DataSet.call(this, fields);
	
    };
  
    BarGraph.prototype.delete = function () {

        var context = this, args = Array.prototype.slice.call(arguments), callback = args.pop();

        if(typeof callback !== 'function') 
            args.push(callback);

        return DataSet.prototype.delete.apply(this, args.concat([
          function(err, info) {
                if(typeof callback === 'function')
                    return callback.apply(context, arguments);
          }
        ]));

    };

    BarGraph.required = {
        '(alignment)' : String,
        '(color)'     : Array,
        '(domain)' : Array,
        '(timings)'  : {
            '(peaks)' : {
                '(decayTime)' : Number,
                '(holdTime)' : Number
            },
            '(values)' : {
                '(decayTime)' : Number,
                '(holdTime)' : Number,
                '(preDelay)' : Number,
                '(responseTime)' : Number
            }                
        },
        '(sortBy)' : String
    };

    BarGraph.prototype.format = {
        'label'        : String,
        '(value)'        : Number,
        '(peak)'        : {
            '+' : Number,
            '-' : Number
        }
    };

    BarGraph.prototype.__proto__ =  DataSet.prototype;
    BarGraph.Peak = Peak;

    return BarGraph;

});
