
function filter (args) {
    
    var exp = Array.prototype.slice.call(args)
                    .map(function(p) { 
                        return new RegExp(String(p), 'gi');
                     }),
        context = this;
    
    return function(key) {
        
        var isFn = typeof context[key] === 'function';
                        
        for(var i=0,len=exp.length;!isFn&&i<len;i++)
            if( key.match(exp[i]) )
                return true;
                        
        return exp.length ? false : !isFn;
    };
    
};

module.exports = function(Route) {
    
    Route.aggregate = {
        
        'mean' : function () {
            
            var result = 0, value, length = 0, ft = filter.call(this, arguments);
            
            for(var k in this)
                if( typeof (value = this[k]) === 'number' && ft(k) ) {
                    result += value;
                    length++;
                }
            
            return result / length;
        },
        
        'median' : function () {
            
            var values = [], value, i, ft = filter.call(this, arguments);
            
            for(var k in this)
                if( typeof (value = this[k]) === 'number' && ft(k) )
                    values.push(value);
            
            values = values.sort();
            i      = values.length / 2;
            
            return values.length % 2 ? values[Math.floor(i)] : (values[i - 1] + values[i]) / 2;
            
        },
        
        'max' : function () {
            
            var value, v, ft = filter.call(this, arguments);
            
            for(var k in this)
                if( typeof (v = this[k]) === 'number' && ft(k)
                   (typeof value === 'undefined' || v > value) )
                    value = v;
            
            return value;
            
        },
        
        'min' : function  () {
            
            var value, v, ft = filter.call(this, arguments);
            
            for(var k in this)
                if( typeof (v = this[k]) === 'number' && ft(k)
                   (typeof value === 'undefined' || v < value) )
                    value = v;
            
            return value;
            
        }
    };
    
};

