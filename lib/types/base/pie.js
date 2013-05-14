;!(function(module) {

	function Pie(fields) {
		
	  fields.bufferSize = 0;

	  vrt.Api.DataSet.call(this, fields);
	};

	Pie.required = {};

	Pie.prototype.__proto__ =  vrt.Api.DataSet.prototype;

	if(module.exports)
		module.exports = Pie;
	else
		module.vrt.Api.Pie = Pie;

})(typeof module === 'undefined' ? window : module);