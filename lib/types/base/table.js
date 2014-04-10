;!(function(module) {

	function Table(fields) {
        
        fields.bufferSize = Number.MAX_VALUE;
        fields.columns = Array.isArray(fields.columns) ? fields.columns : [];
        fields.rows = Array.isArray(fields.rows) ? fields.rows : [];
        fields.step = fields.step || 0;
        
        vrt.Api.DataSet.call(this, fields);
	};

	Table.required = {
        rows : Array,
        columns : Array
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