;!(function(module) {

	function Pie(fields) {
	  fields.bufferSize = Number.MAX_VALUE;
	  vrt.Api.DataSet.call(this, fields);
	};

	Pie.required = {};
	Pie.prototype.format = {
		label : String,
		value : Number
	};

	Pie.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Pie;
	else
		module.vrt.Api.Pie = Pie;

})(typeof module === 'undefined' ? window : module);