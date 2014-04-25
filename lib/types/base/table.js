;!(function(module) {

	function Table(fields) {
        
        fields.bufferSize = Number.MAX_VALUE;
        fields.columns = Array.isArray(fields.columns) ? fields.columns : [];
        fields.rows = Array.isArray(fields.rows) ? fields.rows : [];
        fields.step = fields.step || 0;
        
        fields.defaults = fields.defaults || {};
        
        fields.defaults.row = fields.defaults.row || {};
        fields.defaults.column = fields.defaults.column || {};
        
        vrt.Api.DataSet.call(this, fields);
	};
    
    Table.prototype.delete = function() {
        
        var context = this, args = Array.prototype.slice.call(arguments), callback = args.pop();
        
        if(typeof callback !== 'function') 
            args.push(callback);
        
        return vrt.Api.DataSet.prototype.delete.apply(this, args.concat([
            
            function(err, info) {
                
                var columns = [];
                
                if(!info.path) {
                    
                    info.affected = info.affected.map(function(r) { return r.label; });                    
                    context.rows = context.rows.filter(function(r) { return info.affected.indexOf(r.text) === -1; });
                }
                else if(info.path) {
                    
                    info.affected.forEach(function(c) {
                        for(var k in c.values) {
                            if(columns.indexOf(k) < 0)
                                columns.push(k);
                        }
                    });
                    
                    context.columns = context.columns.filter(function(c) { return columns.indexOf(c.text) > -1; });
                }

                if(typeof callback === 'function')
                    return callback.apply(context, arguments);
        }]));
        
        
    };

	Table.required = {
        rows : Array,
        columns : Array,
        defaults : Object
    };

	Table.prototype.format = {
		label : String,
		values : Object
	};

	Table.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Table;
	else
		module.vrt.Api.Table = Table;

})(typeof module === 'undefined' ? window : module);