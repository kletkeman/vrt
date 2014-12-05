/*
    VRT - Copyright © 2014 Odd Marthon Lende
    All Rights Reserved
*/


define([
    'types/dataset'
],
function(
    DataSet
) {

	function FastCurve(fields) {
        
	 	fields.labels     = fields.labels || [];
        fields.bufferSize = fields.bufferSize || 10000;
        fields.seconds    = fields.seconds || (5 * 60);
        
		DataSet.call(this, fields);

	};
    
  FastCurve.prototype.delete = function() {
        
        var context = this, args = Array.prototype.slice.call(arguments), callback = args.pop();
        
        if(typeof callback !== 'function') 
            args.push(callback);
        
        return DataSet.prototype.delete.apply(this, args.concat([
            
            function(err, info) {
                
                var columns = [];
                
                function without (_, i) { return i !== info.index; }
                
                if( Number.isFinite(info.index) ) {
                               
                    context.labels = context.labels.filter(without);
                    context.curves = context.curves.filter(without);
                }

                if(typeof callback === 'function')
                    return callback.apply(context, arguments);
        }]));        
        
  };

	FastCurve.required = {
		'labels'     : Array,
        '(curves)'   : Array,
        'seconds'    : Number,
        '(defaults)' : Object
	};
	
	FastCurve.prototype.format = {
		'timestamp' : Number,
		'value'     : Number,
		'label'     : String
	};

	FastCurve.prototype.__proto__ = DataSet.prototype;

	return FastCurve;

});
