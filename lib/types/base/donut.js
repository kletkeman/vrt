;!(function(module) {

	function Donut(fields) {
	  fields.bufferSize = Number.MAX_VALUE;
	  vrt.Api.DataSet.call(this, fields);
	};

	Donut.required = {};
	Donut.prototype.format = {
		label : String,
		value : Number
	};

	Donut.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Donut;
	else
		module.vrt.Api.Donut = Donut;

})(typeof module === 'undefined' ? window : module);