;!(function(module) {

	function Gauge(fields) {
		
	  fields.bufferSize = 0;

	  vrt.Api.DataSet.call(this, fields);
	};

	Gauge.required = {
		min: Number,
		max: Number
	};

	Gauge.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Gauge;
	else
		module.vrt.Api.Gauge = Gauge;

})(typeof module === 'undefined' ? window : module);